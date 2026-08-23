import { createClient } from "@/lib/supabase/server";
import { TasksManager } from "@/components/tasks/TasksManager";

export default async function TarefasPage() {
  const supabase = await createClient();

  const [{ data: tasks }, { data: leads }, { data: clients }] = await Promise.all([
    supabase.from("tasks").select("*").order("data_vencimento", { ascending: true }),
    supabase.from("leads").select("id, nome").order("nome"),
    supabase.from("clients").select("id, nome").order("nome"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Tarefas</h1>
        <p className="text-sm text-muted">Follow-ups e lembretes vinculados a leads e clientes.</p>
      </div>
      <TasksManager
        initialTasks={tasks ?? []}
        leads={leads ?? []}
        clients={clients ?? []}
      />
    </div>
  );
}
