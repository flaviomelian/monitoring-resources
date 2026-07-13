import Dashboard from "./component/Dashboard";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 w-full bg-slate-950 font-sans">
      <main className="flex flex-1 w-full flex-col">
        <Dashboard />
      </main>
    </div>
  );
}