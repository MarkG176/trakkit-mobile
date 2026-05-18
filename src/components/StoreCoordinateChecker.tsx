// [CMP-6f1bdd] StoreCoordinateChecker — store coordinate checker component
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Database, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { debugCoordinates, calculateCoordinateDifference } from '@/utils/coordinateValidator';

interface Store {
  id: string;
  store_name: string;
  county: string;
  store_lat: number;
  store_long: number;
}

export const StoreCoordinateChecker: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('store_name');

      if (error) throw error;
      setStores(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stores');
    } finally {
      setLoading(false);
    }
  };

  const checkCoordinates = (store: Store) => {
    console.log(`🏪 Checking coordinates for ${store.store_name}:`);
    debugCoordinates('Store Location', store.store_lat, store.store_long);
    
    // Check against known Cleanshelf location
    const cleanshelfLat = -1.32415;
    const cleanshelfLng = 36.78283;
    
    if (store.store_name.toLowerCase().includes('cleanshelf')) {
      const diff = calculateCoordinateDifference(
        store.store_lat, store.store_long,
        cleanshelfLat, cleanshelfLng
      );
      
      console.log(`🔍 Difference from expected Cleanshelf coordinates:`, {
        expected: `${cleanshelfLat}, ${cleanshelfLng}`,
        actual: `${store.store_lat}, ${store.store_long}`,
        latDiff: diff.latDiff.toFixed(6),
        lngDiff: diff.lngDiff.toFixed(6),
        roughDistanceMeters: Math.round(diff.roughDistanceMeters)
      });
    }
  };

  if (loading) return <div>Loading stores...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Store Coordinate Checker
        </CardTitle>
        <CardDescription>
          Verify coordinates stored in the database for each store
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stores.map((store) => (
            <div key={store.id} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{store.store_name}</span>
                </div>
                <Badge variant="outline">{store.county}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Latitude:</span>
                  <div className="font-mono">{store.store_lat}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Longitude:</span>
                  <div className="font-mono">{store.store_long}</div>
                </div>
              </div>

              {store.store_name.toLowerCase().includes('cleanshelf') && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-yellow-800">
                      Cleanshelf store detected - check console for coordinate analysis
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => checkCoordinates(store)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Debug coordinates in console
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Instructions:</strong>
            <ol className="mt-1 ml-4 list-decimal">
              <li>Click "Debug coordinates in console" for any store</li>
              <li>Check the browser console for detailed coordinate analysis</li>
              <li>Look for any coordinate discrepancies or precision issues</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
