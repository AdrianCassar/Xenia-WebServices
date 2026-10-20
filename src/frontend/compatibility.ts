// Netplay compatibility list (compatibility.html), data in public/data/compatibility.json

type CompatStatus = 'working' | 'partial' | 'broken';
type CompatColumn = 'public' | 'local' | 'onlyLocal' | 'systemlink';
type CompatFilter = CompatColumn | 'all';

interface CompatGame {
  name: string;
  titleId?: string;
  // Title ID of the x360db entry that has artwork for this game
  artwork?: string;
  public?: CompatStatus;
  local?: CompatStatus;
  onlyLocal?: CompatStatus;
  systemlink?: CompatStatus;
  comments?: string;
  others?: string;
}

const ARTWORK_URL = 'https://xenia-manager.github.io/x360db/titles';
const PLACEHOLDER_ICON = 'assets/xbox.svg';

const COLUMNS: CompatColumn[] = ['public', 'local', 'onlyLocal', 'systemlink'];

const STATUS_TEXT: Record<CompatStatus, { icon: string; label: string }> = {
  working: { icon: '✓', label: 'Working' },
  partial: { icon: '!', label: 'Working with issues' },
  broken: { icon: '✕', label: 'Not working' },
};

let games: CompatGame[] = [];
let filter: CompatFilter = 'all';
let query = '';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setText(id: string, text: string | number): void {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = String(text);
  }
}

// Supports the markdown used in the list: `code`, **bold**, [text](url) and line breaks.
function renderMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s()]+(?:\([^\s()]*\)[^\s()]*)*)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>',
    )
    .replace(/\n/g, '<br>');
}

function renderStatus(status?: CompatStatus): string {
  if (!status) {
    return '<td class="status-col"></td>';
  }

  const { icon, label } = STATUS_TEXT[status];

  return `<td class="status-col"><span class="status ${status}" title="${label}" aria-label="${label}">${icon}</span></td>`;
}

function renderGame(game: CompatGame): string {
  const notes = [game.comments, game.others]
    .filter(Boolean)
    .map((text) => `<div class="note">${renderMarkdown(text!)}</div>`)
    .join('');

  const title_id = game.titleId
    ? `<span class="chip">Title ID <b>${escapeHtml(game.titleId)}</b></span>`
    : '';

  const icon = game.artwork
    ? `<img class="compat-icon" src="${ARTWORK_URL}/${escapeHtml(game.artwork)}/artwork/icon.png" width="40" height="40" alt="" loading="lazy">`
    : `<img class="compat-icon placeholder" src="${PLACEHOLDER_ICON}" width="40" height="40" alt="">`;

  return `<tr>
    <th scope="row" class="game-cell">
      <div class="game-cell-inner">
        ${icon}
        <div><span class="game-name">${escapeHtml(game.name)}</span>${title_id}</div>
      </div>
    </th>
    ${COLUMNS.map((column) => renderStatus(game[column])).join('')}
    <td class="notes-cell">${notes}</td>
  </tr>`;
}

function matches(game: CompatGame): boolean {
  if (filter != 'all' && !game[filter]) {
    return false;
  }

  if (!query) {
    return true;
  }

  return (
    game.name.toLowerCase().includes(query) ||
    (game.titleId ?? '').toLowerCase().includes(query)
  );
}

function render(): void {
  const rows = document.getElementById('compat_rows');

  if (!rows) {
    return;
  }

  const visible = games.filter(matches);

  rows.innerHTML = visible.length
    ? visible.map(renderGame).join('')
    : '<tr><td colspan="6" class="compat-loading">No games found.</td></tr>';

  setText(
    'result_count',
    visible.length == games.length
      ? `${games.length} games`
      : `${visible.length} of ${games.length} games`,
  );
}

function updateStats(): void {
  const count = (column: CompatColumn) =>
    games.filter((game) => game[column] == 'working').length;

  setText('total_count', games.length);
  setText('public_count', count('public'));
  setText('local_count', count('local'));
  setText('only_local_count', count('onlyLocal'));
  setText('systemlink_count', count('systemlink'));
}

async function loadGames(): Promise<void> {
  try {
    const response = await fetch('data/compatibility.json');

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    games = await response.json();
  } catch (error) {
    console.log(error instanceof Error ? error.message : error);

    const rows = document.getElementById('compat_rows');

    if (rows) {
      rows.innerHTML =
        '<tr><td colspan="6" class="compat-loading">Unable to load the compatibility list.</td></tr>';
    }

    return;
  }

  games.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );

  updateStats();
  render();
}

document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('search') as HTMLInputElement | null;

  search?.addEventListener('input', () => {
    query = search.value.trim().toLowerCase();
    render();
  });

  document.querySelectorAll<HTMLButtonElement>('.filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      filter = (btn.dataset.filter ?? 'all') as CompatFilter;

      document.querySelectorAll<HTMLButtonElement>('.filter').forEach((b) => {
        const active = b == btn;

        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });

      render();
    });
  });

  // Fall back to the placeholder when x360db has no icon for a title.
  document.getElementById('compat_rows')?.addEventListener(
    'error',
    (event) => {
      const img = event.target;

      if (
        img instanceof HTMLImageElement &&
        !img.classList.contains('placeholder')
      ) {
        img.classList.add('placeholder');
        img.src = PLACEHOLDER_ICON;
      }
    },
    true,
  );

  void loadGames();
});

export {};
