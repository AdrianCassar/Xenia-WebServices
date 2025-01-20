function generateSessionsTable(sessionsData) {
  let result = '';

  result += '<table>\n';

  result += `<tr>\n`;
  result += `<th scope="col">Title</th>\n`;
  result += `<th scope="col">Players</th>\n`;
  result += `<th scope="col" id="title_update">Latest TU</th>\n`;
  result += `</tr>\n`;

  sessionsData?.Titles?.forEach((titleInfo) => {
    let title = 'N/A';

    if (titleInfo?.info?.TitleID) {
      title = titleInfo.info.Name;
    } else if (titleInfo?.name) {
      title = titleInfo.name;
    }

    for (const session of titleInfo?.sessions) {
      let Version_Text =
        session.version && isValidVersion(session.version)
          ? session.version
          : 'N/A';
      let MediaID_Text =
        session.mediaId &&
        session.mediaId != 0 &&
        isHexadecimal(session.mediaId)
          ? session.mediaId
          : 'N/A';

      let TU_Text = 'N/A';
      let TU_download_url = '#';

      if (titleInfo.info?.TitleID && session.mediaId) {
        const Title_Update = GetLatestTU(titleInfo.info, session.mediaId);

        if (Title_Update) {
          TU_download_url = `http://xboxunity.net/Resources/Lib/TitleUpdate.php?tuid=${Title_Update.TitleUpdateID}`;
          TU_Text = `TU: ${Title_Update.Version}`;
        }
      }

      const icon_asset = titleInfo.icon ? titleInfo.icon : 'assets/icon.svg';
      const icon = `<div class="image"><img src="${icon_asset}" width="64" height="64" alt="${title}" title="${title}";"></div>`;

      result += `<tr>\n`;
      result += `<td>
              <div class="container">
                  ${icon}
                  <div class="text">
                      <div><a href="https://github.com/xenia-project/game-compatibility/issues?q=is:issue%20is:open ${titleInfo.titleId}" target="_blank">${title}</a></div>
                      <div style="margin-top: 15px;font-size: 14px;">Title ID: ${titleInfo.titleId}</div>
                      <div style="margin-top: 4px;font-size: 14px;">Media ID: ${MediaID_Text}</div>
                      <div style="margin-top: 4px;font-size: 14px;">Version: ${Version_Text}</div>
                  </div>
              </div>
          </td>\n`;
      result += `<td>${session.players} of ${session.total}</td>\n`;
      result += `<td id="title_update"><a href="${TU_download_url}">${TU_Text}</a></td>\n`;
      result += `</tr>\n`;
    }
  });

  result += '</table>\n';

  return result;
}

function GetLatestTU(titleInfo, mediaId) {
  let latestTU;

  if (mediaId == 0) {
    return latestTU;
  }

  titleInfo?.MediaIds.forEach((media) => {
    if (media.MediaID == mediaId) {
      const lastIndex = media['Updates'].length - 1;
      latestTU = media['Updates'][lastIndex];
    }
  });

  return latestTU;
}

function isHexadecimal(s) {
  try {
    let value = parseInt(s, 16);
    return !isNaN(value);
  } catch (e) {
    return false;
  }
}

function isValidVersion(version) {
  const expr = new RegExp(/^(\d+\.)?(\d+\.)?(\d+\.)(\d+)$/);
  return expr.test(version);
}

let table_loaded = false;

async function refreshSessionTable() {
  let sessionData = {};

  const response = await fetch(window.origin + '/sessions');

  if (response.status == 304 || response.status == 200) {
    sessionData = await response.json();
  } else {
    console.log(`Error ${response.status}`);
  }

  const sessionTable = generateSessionsTable(sessionData);

  if (table_loaded) {
    document.getElementById('sessions').innerHTML = sessionTable;
  } else {
    // Animate skeleton loader for 2s on first load
    setTimeout(() => {
      document.getElementById('sessions').innerHTML = sessionTable;
      table_loaded = true;
    }, 2000);
  }
}

let time = 30;

function refreshTimer() {
  if (time <= 0) {
    time = 30;
    refreshSessionTable();
  }

  if (document.readyState == 'complete') {
    document.getElementById('countdown').innerHTML = `Refreshing in ${time}s`;

    time -= 1;
  }
}

function setIntervalImmediately(func, interval) {
  func();
  return setInterval(func, interval);
}

setIntervalImmediately(refreshTimer, 1000);

refreshSessionTable();
