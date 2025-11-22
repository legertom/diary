const API_URL = 'http://localhost:3000/api';

window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    loadWeeks();
});

async function loadWeeks() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    try {
        const response = await fetch(`${API_URL}/weeks?userId=${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        displayWeeks(data.weeks || []);

    } catch (error) {
        console.error('Error loading weeks:', error);
        document.getElementById('weeksList').innerHTML =
            '<p class="empty-state">Error loading reflections</p>';
    }
}

function displayWeeks(weeks) {
    const listEl = document.getElementById('weeksList');

    if (weeks.length === 0) {
        listEl.innerHTML = '<p class="empty-state">No reflections yet. Complete your first week to see reflections here!</p>';
        return;
    }

    listEl.innerHTML = weeks.map(week => {
        const startDate = new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endDate = new Date(week.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const statusClass = week.status === 'complete' ? 'complete' : 'recording';
        const statusText = week.status === 'complete' ? 'Complete' : 'In Progress';

        const summary = week.insights?.moodTrend
            ? `Mood: ${week.insights.moodTrend}`
            : 'Reflection pending...';

        return `
      <div class="week-card" onclick="viewWeek('${week._id}')">
        <div class="week-header">
          <div class="week-title">Week of ${startDate} - ${endDate}</div>
          <div class="week-status-badge ${statusClass}">${statusText}</div>
        </div>
        <div class="week-summary">${summary}</div>
      </div>
    `;
    }).join('');
}

async function viewWeek(weekId) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/weeks/${weekId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        displayWeekDetail(data.week, data.entries);
        document.getElementById('weekModal').classList.remove('hidden');

    } catch (error) {
        console.error('Error loading week detail:', error);
    }
}

function displayWeekDetail(week, entries) {
    const detailEl = document.getElementById('weekDetail');

    const startDate = new Date(week.weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const endDate = new Date(week.weekEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    let html = `
    <h2>Week of ${startDate} - ${endDate}</h2>
    <p style="color: var(--gray); margin-bottom: 24px;">${entries.length} entries</p>
  `;

    if (week.status === 'complete' && week.insights) {
        // Display AI-generated insights
        html += `
      <div style="margin-bottom: 32px;">
        <h3>Weekly Summary</h3>
        <p style="line-height: 1.6; color: var(--dark);">${week.summary || 'No summary available'}</p>
      </div>
      
      <div style="margin-bottom: 32px;">
        <h3>Mood Trend</h3>
        <p style="font-size: 1.25rem; color: var(--primary); font-weight: 600;">${week.insights.moodTrend}</p>
      </div>
      
      <div style="margin-bottom: 32px;">
        <h3>Key Themes</h3>
        <ul style="list-style: none; padding: 0;">
          ${week.insights.keyThemes.map(theme => `
            <li style="padding: 8px 0; border-bottom: 1px solid var(--border);">
              ${theme}
            </li>
          `).join('')}
        </ul>
      </div>
      
      <div style="margin-bottom: 32px;">
        <h3>Highlights</h3>
        <ul style="list-style: disc; padding-left: 20px; line-height: 1.8;">
          ${week.insights.highlights.map(highlight => `
            <li>${highlight}</li>
          `).join('')}
        </ul>
      </div>
    `;

        // Display location insights if available
        if (week.insights.locationInsights) {
            const loc = week.insights.locationInsights;
            html += `
        <div style="margin-bottom: 32px; background: var(--light-gray); padding: 20px; border-radius: 12px;">
          <h3>Movement & Location Insights</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-top: 16px;">
            <div>
              <div style="font-size: 0.875rem; color: var(--gray);">Unique Locations</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${loc.totalUniqueLocations}</div>
            </div>
            <div>
              <div style="font-size: 0.875rem; color: var(--gray);">Distance Traveled</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${loc.distanceTraveled.toFixed(1)} km</div>
            </div>
            <div>
              <div style="font-size: 0.875rem; color: var(--gray);">Mobility Score</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${loc.mobilityScore}/100</div>
            </div>
            <div>
              <div style="font-size: 0.875rem; color: var(--gray);">Time at Home</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${loc.timeAtHome}%</div>
            </div>
          </div>
        </div>
      `;
        }

        // Display transcriptions
        if (week.transcriptions && week.transcriptions.length > 0) {
            html += `
        <div style="margin-bottom: 32px;">
          <h3>Transcriptions</h3>
          ${week.transcriptions.map((t, index) => {
                const date = new Date(t.recordedAt);
                const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                return `
              <div style="background: var(--light-gray); padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                <div style="font-weight: 600; margin-bottom: 8px; color: var(--dark);">
                  Entry ${index + 1} - ${dateStr} at ${timeStr}
                </div>
                <div style="line-height: 1.6; color: var(--gray);">
                  ${t.text}
                </div>
              </div>
            `;
            }).join('')}
        </div>
      `;
        }
    } else {
        html += `
      <div style="text-align: center; padding: 48px; color: var(--gray);">
        <p>Reflection for this week is still in progress.</p>
        <p style="margin-top: 12px;">Check back after your reflection day!</p>
      </div>
    `;
    }

    detailEl.innerHTML = html;
}

function closeWeekModal() {
    document.getElementById('weekModal').classList.add('hidden');
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Close modal when clicking outside
document.getElementById('weekModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'weekModal') {
        closeWeekModal();
    }
});
