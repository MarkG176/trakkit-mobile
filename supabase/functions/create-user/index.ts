import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, displayName, role, workspaceId, teamId, inventory } = await req.json();

    if (!email || !workspaceId) {
      return new Response(
        JSON.stringify({ error: "Email and workspaceId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`User already exists with ID: ${userId}`);
    } else {
      // Create new user with a temporary password (they'll use magic link to sign in)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      });

      if (createError) {
        throw createError;
      }

      userId = newUser.user.id;
      console.log(`Created new user with ID: ${userId}`);
    }

    // Create or update user_roles entry
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({
        user_id: userId,
        email,
        display_name: displayName || email.split("@")[0],
        role: role || "agent",
        is_active: true,
      }, { onConflict: "user_id" });

    if (roleError) {
      console.error("Error creating user_roles:", roleError);
    }

    // Create user_workspaces entry
    const { error: workspaceError } = await supabaseAdmin
      .from("user_workspaces")
      .upsert({
        user_id: userId,
        workspace_id: workspaceId,
        role: "member",
        is_active: true,
        team_type: "wholesale",
      }, { onConflict: "user_id,workspace_id" });

    if (workspaceError) {
      console.error("Error creating user_workspaces:", workspaceError);
    }

    // Add to team if teamId provided
    if (teamId) {
      // Check if already in team
      const { data: existingMembership } = await supabaseAdmin
        .from("team_members")
        .select("id")
        .eq("agent_id", userId)
        .eq("team_id", teamId)
        .maybeSingle();

      if (!existingMembership) {
        const { error: teamError } = await supabaseAdmin
          .from("team_members")
          .insert({
            agent_id: userId,
            team_id: teamId,
            workspace_id: workspaceId,
            is_deleted: false,
          });

        if (teamError) {
          console.error("Error adding to team:", teamError);
        } else {
          console.log(`Added user to team ${teamId}`);
        }
      } else {
        console.log(`User already in team ${teamId}`);
      }
    }

    // Assign inventory if provided
    if (inventory && Array.isArray(inventory) && inventory.length > 0) {
      // First, create an agent_task for this user (set assigned_product_variant_id to null explicitly)
      const { data: taskData, error: taskError } = await supabaseAdmin
        .from("agent_tasks")
        .insert({
          agent_id: userId,
          workspace_id: workspaceId,
          individual_sales_target: 0,
          status: "active",
          is_deleted: false,
          assigned_product_variant_id: null,
        })
        .select("id")
        .single();

      if (taskError) {
        console.error("Error creating agent_task:", taskError);
      } else {
        const taskId = taskData.id;
        console.log(`Created agent_task with ID: ${taskId}`);

        // Now insert inventory items with the task_id
        for (const item of inventory) {
          const { error: invError } = await supabaseAdmin
            .from("agent_task_inventory")
            .insert({
              agent_id: userId,
              task_id: taskId,
              product_variant_id: item.product_variant_id,
              name: item.name,
              amount_issued: item.amount_issued,
              is_deleted: false,
            });

          if (invError) {
            console.error(`Error adding inventory item ${item.name}:`, invError);
          }
        }
        console.log(`Added ${inventory.length} inventory items`);
      }
    }

    // Send magic link for password setup
    const { error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: "https://trakkit-mobile.lovable.app/auth/callback",
      },
    });

    if (magicLinkError) {
      console.error("Error generating magic link:", magicLinkError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId,
        message: `User ${email} has been set up successfully` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
