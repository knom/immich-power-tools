import AssetsOptions from "@/components/assets/assets-options/AssetsOptions";
import MissingLocationAssets from "@/components/assets/missing-location/MissingLocationAssets";
import MissingLocationDates from "@/components/assets/missing-location/MissingLocationDates";
import TagMissingLocationDialog from "@/components/assets/missing-location/TagMissingLocationDialog/TagMissingLocationDialog";
import PageLayout from "@/components/layouts/PageLayout";
import Header from "@/components/shared/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import MissingLocationContext, {
  IMissingLocationConfig,
} from "@/contexts/MissingLocationContext";
import { updateAssets } from "@/handlers/api/asset.handler";

import { IPlace } from "@/types/common";
import { SortDesc, SortAsc } from "lucide-react";
import { isSameDay } from "date-fns";
import { useRouter } from "next/router";
import React, { useMemo } from "react";

export default function MissingLocations() {
  const { toast } = useToast();

  const { query } = useRouter();
  const { startDate } = query as { startDate: string };
  const [config, setConfig] = React.useState<IMissingLocationConfig>({
    startDate: startDate || undefined,
    selectedIds: [],
    assets: [],
    sort: "fileOriginalDate",
    sortOrder: "asc",
    dates: []
  });

  const selectedAssets = useMemo(() => config.assets.filter((a) => config.selectedIds.includes(a.id)), [config.assets, config.selectedIds]);

  const handleSubmit = async (place: IPlace) => {
    await updateAssets({
      ids: config.selectedIds,
      latitude: place.latitude,
      longitude: place.longitude,
    });

    const newAssets = config.assets.filter(asset => !config.selectedIds.includes(asset.id));

    if (config.startDate) {
      const dayRecord = config.dates.filter(f => isSameDay(new Date(f.date), new Date(config.startDate!)));

      if (dayRecord.length === 1) {
        if (newAssets.length > 0)
          dayRecord[0].asset_count = newAssets.length;
        else {
          const indexToRemove = config.dates.findIndex(v=>isSameDay(v.date, dayRecord[0].date));

          if (indexToRemove !== -1) {
            config.dates.splice(indexToRemove, 1);
          }
        }
      }
    }

    setConfig({
      ...config,
      selectedIds: [],
      assets: newAssets
    });
  };

  const handleChange = (e: {sortOrder: "asc"|"desc"}) => {
    setConfig({ ...config, sortOrder:e.sortOrder });
  }

  return (
    <PageLayout className="!p-0 !mb-0">
      <Header
        leftComponent="Missing Location"
        rightComponent={
          <>
            <Badge variant={"outline"}>
              {config.selectedIds.length} Selected
            </Badge>
            {config.selectedIds.length > 0 ? (
              <Button
                variant={"outline"}
                onClick={() =>
                  setConfig({
                    ...config,
                    selectedIds: [],
                  })
                }
              >
                Unselect all
              </Button>
            ) : (
              <Button
                variant={"outline"}
                onClick={() =>
                  setConfig({
                    ...config,
                    selectedIds: config.assets.map((a) => a.id),
                  })
                }
              >
                Select all
              </Button>
            )}
            <TagMissingLocationDialog onSubmit={handleSubmit} />

            <div>
              <Button variant="default" size="sm" onClick={() => handleChange({ sortOrder: config.sortOrder === "asc" ? "desc" : "asc" })}>
                {config.sortOrder === "asc" ? <SortAsc size={16} /> : <SortDesc size={16} />}
              </Button>
            </div>

            <AssetsOptions assets={selectedAssets} onAdd={() => { }} />
          </>
        }
      />
      <MissingLocationContext.Provider
        value={{
          ...config,
          updateContext: (newConfig: Partial<IMissingLocationConfig>) =>
            setConfig({ ...config, ...newConfig }),
        }}
      >
        <div className="flex divide-y">
          <MissingLocationDates />
          <MissingLocationAssets />
        </div>
      </MissingLocationContext.Provider>
    </PageLayout>
  );
}
