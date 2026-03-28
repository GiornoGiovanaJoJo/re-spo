(function () {
    const DEFAULT_TILES = [
        'Молочные линии',
        'Асептический разлив',
        'СИП-станции',
        'Модернизация цехов'
    ];

    function isValidTiles(list) {
        if (!Array.isArray(list) || list.length !== DEFAULT_TILES.length) return false;
        return list.every(
            (t) => typeof t === 'string' && t.trim().length > 0 && t.length <= 400
        );
    }

    function renderTiles(container, titles) {
        container.textContent = '';
        titles.forEach((raw) => {
            const text = String(raw).trim();
            const card = document.createElement('div');
            card.className =
                'group relative aspect-[320/176] overflow-hidden rounded-[24px]';
            const bg = document.createElement('div');
            bg.className =
                'absolute inset-0 bg-respo-blue/10 transition-colors group-hover:bg-respo-blue/20';
            const flex = document.createElement('div');
            flex.className =
                'absolute inset-0 p-4 sm:p-6 flex items-center justify-center text-center';
            const p = document.createElement('p');
            p.className =
                'text-respo-dark font-medium text-base sm:text-lg lg:text-[19px] leading-tight';
            p.textContent = text;
            flex.appendChild(p);
            card.appendChild(bg);
            card.appendChild(flex);
            container.appendChild(card);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('home-technology-tiles');
        if (!container) return;

        fetch('/api/home-content')
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                const tiles = data && data.technologyTiles;
                if (isValidTiles(tiles)) renderTiles(container, tiles);
            })
            .catch(() => {});
    });
})();
