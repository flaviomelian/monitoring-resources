import Header from "../component/Header";
import Kanban from "../component/Kanban";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 w-full bg-slate-950 font-sans">
      <div className="p-6">
        <Header />
      </div>
      <Kanban />
    </div>
  );
}