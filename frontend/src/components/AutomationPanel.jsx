// src/components/AutomationPanel.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
      setForm({ name: '', triggerType: 'task_status_change', actionType: 'assign_badge', params: '{}' });
    } catch (err) {
      alert('Create failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: 20 }}>
      <h3>Automations</h3>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {automations.length === 0 ? (
        <p>No automations found.</p>
      ) : (
        <ul>
          {automations.map((automation) => (
            <li key={automation._id} style={{ marginBottom: 8 }}>
              <strong>{automation.name}</strong> <br />
              Trigger: {automation.trigger.type} <br />
              Action: {automation.action.type}
              {automation.createdBy._id === currentUser._id && (
                <button onClick={() => handleDelete(automation._id)} style={{ marginLeft: 10 }}>Delete</button>
              )}
            </li>
          ))}
        </ul>
      )}

      <hr />
      <h4>Create New Automation</h4>
      <input
        type="text"
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <br />
      <select
        value={form.triggerType}
        onChange={(e) => setForm({ ...form, triggerType: e.target.value })}
      >
        <option value="task_status_change">Task Status Change</option>
        <option value="task_assignment">Task Assignment</option>
        <option value="task_due_date_passed">Due Date Passed</option>
      </select>
      <br />
      <select
        value={form.actionType}
        onChange={(e) => setForm({ ...form, actionType: e.target.value })}
      >
        <option value="assign_badge">Assign Badge</option>
        <option value="change_task_status">Change Task Status</option>
        <option value="send_notification">Send Notification</option>
      </select>
      <br />
      <textarea
        rows="4"
        cols="50"
        placeholder='Optional params as JSON, e.g. {"fromStatus": "To Do", "status": "Done"}'
        value={form.params}
        onChange={(e) => setForm({ ...form, params: e.target.value })}
      />
      <br />
      <button onClick={handleCreate}>Create Automation</button>
    </div>
  );
};

export default AutomationPanel;
