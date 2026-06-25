import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Store } from "lucide-react";
import { format } from "date-fns";
import { getThumbnailUrl, thumbnailFallback } from "@/utils/imageTransform";
import type { CheckInRecord } from "@/hooks/useAgentCheckIns";

/**
 * Mobile card for a single agent check-in, mirroring the supervisor feed card
 * (selfie thumbnail, time, store, coordinates, in-range badge + distance).
 */
export const CheckInRecordCard = memo(({ checkIn }: { checkIn: CheckInRecord }) => {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex gap-3">
          {checkIn.selfie_url ? (
            <img
              src={getThumbnailUrl(checkIn.selfie_url, { width: 160 })}
              alt="Check-in selfie"
              loading="lazy"
              decoding="async"
              className="w-16 h-16 rounded-md object-cover shrink-0"
              onError={(e) => thumbnailFallback(e, checkIn.selfie_url!)}
            />
          ) : (
            <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                {format(new Date(checkIn.timestamp), "MMM d, h:mm a")}
              </div>
              {checkIn.in_range !== null && (
                <Badge
                  variant={checkIn.in_range ? "default" : "destructive"}
                  className="text-[10px] px-1.5 py-0 shrink-0"
                >
                  {checkIn.in_range ? "In Range" : "Out of Range"}
                </Badge>
              )}
            </div>

            {checkIn.store_name && (
              <p className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
                <Store className="w-3 h-3 shrink-0" /> {checkIn.store_name}
              </p>
            )}

            {checkIn.location_lat != null && checkIn.location_lng != null && (
              <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                {Number(checkIn.location_lat).toFixed(4)}, {Number(checkIn.location_lng).toFixed(4)}
              </p>
            )}

            {checkIn.distance_from_assigned != null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {Number(checkIn.distance_from_assigned).toFixed(0)}m from assigned location
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

CheckInRecordCard.displayName = "CheckInRecordCard";
