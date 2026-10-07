import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TaskStats from '../components/TaskStats.jsx';
import TaskFilters from '../components/TaskFilters.jsx';
import TaskList from '../components/TaskList.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { deleteTask, getTasks } from '../services/taskService.js';
import { isLate } from '../utils/dates.js';

// page liste des tâches
function TaskListPage() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');

  // filtres
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [search, setSearch] = useState('');

  // récupération des tâches
  useEffect(() => {
    getTasks()
      .then((data) => setTasks(data))
      .catch((err) => setError(err.message));
  }, []);

  // suppression d'une tâche
  async function handleDelete(task) {
    if (!window.confirm(`Supprimer « ${task.title} » ?`)) return;
    try {
      await deleteTask(task._id);
      setTasks(tasks.filter((t) => t._id !== task._id));
    } catch (err) {
      setError(err.message);
    }
  }

  // on applique les filtres puis on trie par date
  const visibleTasks = tasks
    .filter((t) => {
      if (status === 'all') return true;
      if (status === 'late') return isLate(t);
      return t.status === status;
    })
    .filter((t) => priority === 'all' || t.priority === priority)
    .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''));

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Tâches</h1>
          <p className="page-sub">{tasks.length} tâche(s) au total</p>
        </div>
        <Link to="/tasks/new" className="btn btn-primary">+ Nouvelle tâche</Link>
      </div>

      <ErrorMessage message={error} />

      <TaskStats tasks={tasks} />

      <h2 className="section-title">Toutes les tâches</h2>
      <TaskFilters
        status={status}
        setStatus={setStatus}
        priority={priority}
        setPriority={setPriority}
        search={search}
        setSearch={setSearch}
      />
      <p className="results">{visibleTasks.length} résultat(s)</p>

      <TaskList tasks={visibleTasks} onDelete={handleDelete} />
    </section>
  );
}

export default TaskListPage;
