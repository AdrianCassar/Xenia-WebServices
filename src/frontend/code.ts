let time = 30;
let serverStartTime: Date | null = null;

function setText(id: string, text: string): void {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = text;
  }
}

function setHtml(id: string, html: string): void {
  const element = document.getElementById(id);

  if (element) {
    element.innerHTML = html;
  }
}

function generateSessionsTable(sessionsData: SessionsResponse): string {
  let result = '<table>\n';

  result += `<tr>
    <th scope="col">Gaming Sessions</th>
    <th scope="col">Players</th>
  </tr>\n`;

  if (sessionsData?.Metadata) {
    const Build_Commit = sessionsData.Metadata.HEROKU_BUILD_COMMIT;
    const Released_At = sessionsData.Metadata.HEROKU_RELEASE_CREATED_AT;

    if (!serverStartTime && sessionsData.Metadata.START_TIME) {
      serverStartTime = new Date(sessionsData.Metadata.START_TIME);
      updateUptime();
    }

    const BUILD_COMMIT = document.getElementById('BUILD_COMMIT');

    setText(
      'RELEASE_CREATED_AT',
      Released_At ? new Date(Released_At).toDateString() : 'N/A',
    );

    if (BUILD_COMMIT && Build_Commit) {
      const Commit_URL = `https://github.com/AdrianCassar/Xenia-WebServices/commit/${Build_Commit}`;
      BUILD_COMMIT.setAttribute('href', Commit_URL);
      BUILD_COMMIT.textContent = Build_Commit.substring(0, 7);
    } else if (BUILD_COMMIT) {
      BUILD_COMMIT.removeAttribute('target');
      BUILD_COMMIT.setAttribute('href', '#');
      BUILD_COMMIT.textContent = 'N/A';
    }
  }

  sessionsData?.Titles?.forEach((titleInfo) => {
    const title = titleInfo?.name || 'N/A';

    for (const session of titleInfo?.sessions ?? []) {
      const Version_Text =
        session.version && isValidVersion(session.version)
          ? session.version
          : 'N/A';
      const MediaID_Text =
        session.mediaId &&
        !isZero(session.mediaId) &&
        isHexadecimal(session.mediaId)
          ? session.mediaId
          : 'N/A';

      const icon_asset = titleInfo.icon || 'assets/icon.svg';
      const icon = `<div class="image"><img src="${icon_asset}" width="64" height="64" alt="${title}" title="${title}"></div>`;

      const HOST_GAMERTAG = session.host_gamertag;
      const host_gamertag_div = HOST_GAMERTAG
        ? `<div id="host_gamertag" style="white-space: pre-line;margin-top: 15px;">${HOST_GAMERTAG}</div>`
        : '';

      const HOST_PRESENCE = session.host_presence;
      const presence_div = HOST_PRESENCE
        ? `<div style="white-space: pre-line;">${HOST_PRESENCE}</div>`
        : '';

      const HOST_XUID = session.host_xuid;
      const host_xuid_button = HOST_XUID
        ? `<button class="copy-xuid-btn" data-xuid="${HOST_XUID}" style="margin-top: 5px;">Copy XUID</button>`
        : '';

      const players = Array.isArray(session.players) ? session.players : [];

      let player_gamertags = 'Player 1';

      if (players.length) {
        player_gamertags = players
          .map(
            (player, index) =>
              `<div ${index == 0 ? 'id="host_item"' : ''} class="list-item">
                <div class="image"><img src="${player.gamerpic}" width="64" height="64"></div>
                ${player.gamertag}
              </div>`,
          )
          .join('');
      }

      const gridAdjustment =
        players.length < 3
          ? `style="grid-template-columns: repeat(${players.length}, 1fr);"`
          : '';

      result += `<tr>
        <td>
          <div class="container">
            ${icon}
            <div class="box">
              <div id="game_title"><a href="https://github.com/xenia-project/game-compatibility/issues?q=is:issue%20is:open ${titleInfo.titleId}" target="_blank">${title}</a></div>
              ${host_gamertag_div}
              ${presence_div}
              ${host_xuid_button}
            </div>
            <div class="box">
              <div class="entry">Title ID: ${titleInfo.titleId}</div>
              <div class="entry">Media ID: ${MediaID_Text}</div>
              <div class="entry">Version: ${Version_Text}</div>
            </div>
          </div>
        </td>
        <td>
          <div ${gridAdjustment} class="list-container" id="list">
            ${player_gamertags}
          </div>
          <label>${players.length ? players.length : '1'} of ${session.total}</label>
        </td>
      </tr>\n`;
    }
  });

  result += '</table>\n';
  return result;
}

function isZero(s: string): boolean {
  return Number(s) === 0;
}

function isHexadecimal(s: string): boolean {
  return !isNaN(parseInt(s, 16));
}

function isValidVersion(version: string): boolean {
  return /^(\d+\.)?(\d+\.)?(\d+\.)(\d+)$/.test(version);
}

let table_loaded = false;

async function refreshSessionTable(): Promise<void> {
  let sessionData: SessionsResponse;

  try {
    const response = await fetch(window.origin + '/sessions');

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    sessionData = await response.json();
  } catch (error) {
    console.log(error instanceof Error ? error.message : error);
    return;
  }

  const sessionTable = generateSessionsTable(sessionData);

  if (table_loaded) {
    setHtml('sessions', sessionTable);
  } else {
    // Animate skeleton loader for 2s on first load
    setTimeout(() => {
      setHtml('sessions', sessionTable);
      table_loaded = true;
    }, 2000);
  }
}

function formatUTCToDDHHMMSS(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  return `${days}d ${hh}:${mm}:${ss}`;
}

function updateUptime(): void {
  if (serverStartTime) {
    const diffMs = Date.now() - serverStartTime.getTime();
    const uptimeStr = formatUTCToDDHHMMSS(diffMs);

    setText('UPTIME', uptimeStr);
  }
}

function refreshTimer(): void {
  if (time <= 0) {
    time = 30;
    void refreshSessionTable();
  }

  if (document.readyState === 'complete') {
    setText('countdown', `Refreshing in ${time}s`);
    updateUptime();

    time -= 1;
  }
}

function setIntervalImmediately(func: () => void, interval: number): number {
  func();
  return window.setInterval(func, interval);
}

document.addEventListener('DOMContentLoaded', () => {
  setIntervalImmediately(refreshTimer, 1000);
  void refreshSessionTable();
});

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const btn = event.target.closest<HTMLButtonElement>('.copy-xuid-btn');

  if (btn) {
    const xuid = btn.dataset.xuid ?? '';
    const flash = (border: string) => {
      btn.style.border = border;

      setTimeout(() => {
        btn.style.border = '';
      }, 2000);
    };

    navigator.clipboard
      .writeText(xuid)
      .then(() => flash('2px solid green'))
      .catch(() => flash('2px solid red'));
  }

  if (event.target.closest('#server_details_btn')) {
    const details = document.getElementById('server_details');

    if (details) {
      details.style.display =
        getComputedStyle(details).display === 'none' ? 'block' : 'none';
    }
  }
});
