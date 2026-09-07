import Kanban from "../component/Kanban";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 w-full bg-slate-950 font-sans p-10">
      <Kanban />
    </div>
  );
}