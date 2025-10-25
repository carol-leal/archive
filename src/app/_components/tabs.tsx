"use client";
import { Tabs, Tab } from "@heroui/react";
import {
  PopcornIcon,
  TicketIcon,
  FilmStripIcon,
  FilmReelIcon,
} from "@phosphor-icons/react";
export default function TabsComponent() {
  return (
    <div className="m-4 flex w-full flex-col items-center justify-center">
      <Tabs aria-label="Options" color="primary" variant="bordered">
        <Tab
          key="all"
          title={
            <div className="flex items-center space-x-2">
              <PopcornIcon />
              <span>All</span>
            </div>
          }
        />
        <Tab
          key="pending"
          title={
            <div className="flex items-center space-x-2">
              <FilmReelIcon />
              <span>Pending</span>
            </div>
          }
        />
        <Tab
          key="watching"
          title={
            <div className="flex items-center space-x-2">
              <TicketIcon />
              <span>Watching</span>
            </div>
          }
        />
        <Tab
          key="watched"
          title={
            <div className="flex items-center space-x-2">
              <FilmStripIcon />
              <span>Watched</span>
            </div>
          }
        />
      </Tabs>
    </div>
  );
}
