// ... everything above remains exactly the same

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to submit a report',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Only insert note if there's content
      if (notes.trim()) {
        const { error } = await supabase
          .from('notes')
          .insert({
            agent_id: user.id,
            workspace_id: currentWorkspaceId,
            content: notes.trim(),
            note_type: 'daily_report',
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Evening report submitted successfully',
      });

      setNotes("");
      onOpenChange(false);
      onComplete?.();
    } catch (error: any) {
      console.error('Error submitting evening report:', error);

      // 🔍 ADDED: Show real Supabase error message
      toast({
        title: 'Error',
        description: error?.message || 'Failed to submit evening report',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

// ... everything below remains exactly the same
