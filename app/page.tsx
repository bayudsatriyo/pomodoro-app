import PomodoroTimer from "@/components/Timer/PomodoroTimer";
import HealthScheduler from "@/components/Health/HealthScheduler";
import NotificationAlert from "@/components/Health/NotificationAlert";
import PostureMonitor from "@/components/Health/PostureMonitor";
import CameraIndicator from "@/components/Camera/CameraIndicator";
import CameraPermissionRequest from "@/components/Camera/CameraPermissionRequest";

export default function Home() {
  return (
    <main className="main-container">
      <CameraPermissionRequest />
      <PomodoroTimer />
      <HealthScheduler />
      <PostureMonitor />
      <NotificationAlert />
      <CameraIndicator />
    </main>
  );
}
