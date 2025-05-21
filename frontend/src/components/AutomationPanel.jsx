import React, { useEffect, useState } from 'react';
import axios from 'axios';

const styles = {
  panel: {
    border: '1px solid #ccc',
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    maxWidth: 600,
    margin: 'auto',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    marginBottom: 16,
    color: '#333',
    fontSize: 20,
  },
  subTitle: {
    marginTop: 32,
    color: '#444',
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginBottom: 12,
  },
  empty: {
    color: '#777',
  },
  list: {
    listStyle: 'none',
    paddingLeft: 0,
  },
  listItem: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff4d4f',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 6,
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 16,
  },
  input: {
    padding: '8px 12px',
    fontSize: 14,
    border: '1px solid #bbb',
    borderRadius: 6,
  },
  select: {
    padding: '8px 12px',
    fontSize: 14,
    border: '1px solid #bbb',
    borderRadius: 6,
  },
  textarea: {
    padding: '8px 12px',
    fontSize: 14,
    border: '1px solid #bbb',
    borderRadius: 6,
    resize: 'vertical',
  },
  createButton: {
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: 6,
    fontSize: 14,
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
};

const AutomationPanel = ({ projectId, currentUser, token }) => {
  const [automations, setAutomations] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    triggerType: 'task_status_change',
    actionType: 'assign_badge',
    params: '{}',
  });

  useEffect(() => {
    const fetchAutomations = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/automations/project/${projectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAutomations(res.data.automations);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load automations');
      }
    };

    fetchAutomations();
  }, [projectId, token]);

  const handleDelete = async (automationId) => {
    try {
      await axios.delete(`http://localhost:8000/automations/${automationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAutomations((prev) => prev.filter((a) => a._id !== automationId));
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCreate = async () => {
    try {
      const { name, triggerType, actionType, params } = form;
      const parsedParams = JSON.parse(params);

      const res = await axios.post(
        'http://localhost:8000/automations/create',
        {
          projectId,
          name,
          trigger: { type: triggerType, conditions: parsedParams },
          action: { type: actionType, parameters: parsedParams },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAutomations((prev) => [res.data.automation, ...prev]);
      setForm({
        name: '',
        triggerType: 'task_status_change',
        actionType: 'assign_badge',
        params: '{}',
      });
    } catch (err) {
      alert('Create failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Automations</h3>

      {error && <p style={styles.error}>{error}</p>}

      {automations.length === 0 ? (
        <p style={styles.empty}>No automations found.</p>
      ) : (
        <ul style={styles.list}>
          {automations.map((automation) => (
            <li key={automation._id} style={styles.listItem}>
              <div>
                <strong>{automation.name}</strong> <br />
                Trigger: {automation.trigger.type} <br />
                Action: {automation.action.type}
              </div>
              {automation.createdBy._id === currentUser._id && (
                <button
                  onClick={() => handleDelete(automation._id)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <h4 style={styles.subTitle}>Create New Automation</h4>
      <div style={styles.form}>
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={styles.input}
        />

        <select
          value={form.triggerType}
          onChange={(e) => setForm({ ...form, triggerType: e.target.value })}
          style={styles.select}
        >
          <option value="task_status_change">Task Status Change</option>
          <option value="task_assignment">Task Assignment</option>
          <option value="task_due_date_passed">Due Date Passed</option>
        </select>

        <select
          value={form.actionType}
          onChange={(e) => setForm({ ...form, actionType: e.target.value })}
          style={styles.select}
        >
          <option value="assign_badge">Assign Badge</option>
          <option value="change_task_status">Change Task Status</option>
          <option value="send_notification">Send Notification</option>
        </select>

        <textarea
          rows="4"
          placeholder='Optional params as JSON, e.g. {"fromStatus": "To Do", "status": "Done"}'
          value={form.params}
          onChange={(e) => setForm({ ...form, params: e.target.value })}
          style={styles.textarea}
        />

        <button onClick={handleCreate} style={styles.createButton}>
          Create Automation
        </button>
      </div>
    </div>
  );
};

export default AutomationPanel;
