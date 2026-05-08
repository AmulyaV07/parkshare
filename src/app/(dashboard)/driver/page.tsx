import { Navbar } from "@/components/shared/Navbar";
import { ParkingMap } from "@/components/map/ParkingMap";
import { ActiveBookingPanel } from "@/components/driver/ActiveBookingPanel";
import { BookingHistory } from "@/components/driver/BookingHistory";

export default function DriverDashboardPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Navbar />
      <div className="relative flex flex-1 flex-col">
        <div className="relative flex min-h-[520px] flex-1">
          <ParkingMap />
          <ActiveBookingPanel />
        </div>
        <div className="bg-zinc-50 px-3 py-8">
          <div className="mx-auto w-full max-w-2xl">
            <BookingHistory />
          </div>
        </div>
      </div>
    </div>
  );
}

