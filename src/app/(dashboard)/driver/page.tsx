import { Navbar } from "@/components/shared/Navbar";
import { ParkingMap } from "@/components/map/ParkingMap";

export default function DriverDashboardPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Navbar />
      <div className="relative flex flex-1">
        <ParkingMap />
      </div>
    </div>
  );
}

