const Display = {
    healElement: $('#heal'),
    logElement: $('#console .console-text'),
    setValue: function(domElement, newValue, append) {
        if (append === undefined) { append = false }
        if (append) {
            domElement.innerHTML += newValue;
        }
        if (!append) {
            if (domElement.innerHTML !== newValue) {
                domElement.innerHTML = newValue;
            }
        }
    },
    getValue: function(domElement) {
        return domElement.innerHTML;
    },
    setProp: function(domElement, attribute, newValue) {
        if (domElement[attribute] !== newValue) {
            domElement[attribute] = newValue
        }
    },
    renderPokeOnContainer: function(id, poke, face) {
        face = face || 'front';
        const pokeStatusAsText = (poke) => {
            let output = '';
            output += 'Attack Speed: ' + poke.attackSpeed()/1000 + '<br>';
            output += '\nAttack: ' + poke.avgAttack() + '<br>';
            output += '\nDefense: ' + poke.avgDefense() + '<br>';
            return output
        };
        const container = $('#' + id + 'Box').querySelector('.pokeBox');
        const domElements  = {
            name: container.querySelector('.name'),
            img: container.querySelector('.img'),
            hp: container.querySelector('.hp'),
            hpBar: container.querySelector('.hpBar'),
            expBar: container.querySelector('.expBar'),
            status: container.querySelector('.status')
        };
        this.setValue(domElements.name, poke.pokeName() + ' (' + poke.level() + ')');
        this.setProp(domElements.img, 'src', poke.image()[face]);
        this.setValue(domElements.hp, poke.lifeAsText());
        this.setProp(domElements.hpBar, 'value', poke.getHp());
        this.setProp(domElements.hpBar, 'max', poke.maxHp());
        if (id === 'player') {
            this.setProp(domElements.expBar, 'value', Math.floor(poke.currentExp() - poke.thisLevelExp()));
            this.setProp(domElements.expBar, 'max', poke.nextLevelExp() - poke.thisLevelExp());
        }
        this.setValue(domElements.status, pokeStatusAsText(poke))
    },
    renderPokeDexSort: function() {
        let sortHTML = '<option value="all">All</option>';
        let showList = false;
        if (player.unlocked.completeDex) {
            sortHTML += '<option value="missing"' + (player.settings.dexView === 'missing' ? ' selected="true"' : '') + '>Missing</option>';
            showList = true;
        }
        if (player.unlocked.shinyDex) {
            sortHTML += '<option value="shiny"' + (player.settings.dexView === 'shiny' ? ' selected="true")' : '') + '>Shiny</option>';
            showList = true;
        }
        if (showList) {
            $('#dexView').innerHTML = sortHTML;
            $('#dexView').style.display = 'block';
        }
    },
    renderPokeDex: function() {
        const dexData = player.getPokedexData();
        const listElement = $('#dexList');
        let listValue = '';
        function findFlag(obj){ return (this == obj.name) }
        let count = POKEDEX.length;
        if (player.settings.dexView === 'all') {
            let findIndex = p => POKEDEX.findIndex(x=>x.pokemon[0].Pokemon == p.name);
            let dex = (lhs, rhs) => findIndex(rhs) - findIndex(lhs);
            const highestPoke = player.getPokedexData().sort(dex)[0];
            let highestID = findIndex(highestPoke);
            count = highestID + 5;
        }
        for(let y = 0; y < count; y++) {
            let dexEntry = dexData.find(findFlag, POKEDEX[y].pokemon[0].Pokemon);
            if (typeof dexEntry === 'undefined')
                dexEntry = {name: '', flag: 0};
            if (player.settings.dexView == 'all' ||
                (player.settings.dexView == 'own' && (dexEntry.flag == POKEDEXFLAGS.ownNormal || dexEntry.flag == POKEDEXFLAGS.ownShiny)) ||
                (player.settings.dexView == 'owned' && (dexEntry.flag >= POKEDEXFLAGS.releasedNormal)) ||
                (player.settings.dexView == 'missing' && (dexEntry.flag != POKEDEXFLAGS.ownNormal && dexEntry.flag != POKEDEXFLAGS.ownShiny)) ||
                (player.settings.dexView == 'shiny' && (dexEntry.flag == POKEDEXFLAGS.ownShiny))) {
                if (player.settings.dexView === 'all' && dexEntry.flag == POKEDEXFLAGS.unseen) {
                    listValue += '<li class="pokeDex' + dexEntry.flag + '">' + (y + 1) + ' ???</li>';
                } else {
                    listValue += '<li class="pokeDex' + dexEntry.flag + '">' + (y + 1) + ' ' + POKEDEX[y].pokemon[0].Pokemon + '</li>';
                }
            }
        }
        this.setValue(listElement, listValue, false);
        this.renderPokeDexSort();
    },
    renderHeal: function(canHeal) {
        if (canHeal === true) {
            this.setValue(this.healElement, 'Heal!');
            player.healAllPokemons();
            combatLoop.refresh();
            renderView(dom, enemy, player, false);
        }
        if (typeof canHeal === 'number') {
            this.setValue(this.healElement, 'Heal: ' + Math.floor(((canHeal/30000)*100)) + '%')
        }
    },
    pokeColor: function(poke) {
        if (poke.alive()) {
            if (poke === player.activePoke()) {
                if (poke.shiny()) {
                    return COLORS.pokemon.activeShiny;
                } else {
                    return COLORS.pokemon.activeNormal;
                }
            } else {
                if (poke.shiny()) {
                    return COLORS.pokemon.inactiveShiny;
                } else {
                    return COLORS.pokemon.inactiveNormal;
                }
            }
        } else {
            return COLORS.pokemon.dead;
        }
    },
    renderPokeSort: function() {
        $('#autoSort').checked = player.settings.autoSort;
        if (player.settings.autoSort) {
            $('#pokeSortOrderSelect').style.display = 'inline';
            $('#pokeSortDirSelect').style.display = 'inline';
        } else {
            $('#pokeSortOrderSelect').style.display = 'none';
            $('#pokeSortDirSelect').style.display = 'none';
        }
    },
    renderPokeList: function(purge = true) {
        if (purge && player.settings.autoSort) {
            // if doing a list purge then reorder the pokemon
            player.sortPokemon();
        }
        const list = player.getPokemon();
        const listElement = $('#rosterList');
        const deleteEnabled = $('#enableDelete').checked;
        listElement.className = 'list' + (deleteEnabled ? ' manageTeamEnabled' : '');
        let listElementsToAdd = '';
        list.forEach((poke, index) => {
            const listItemElement = listElement.querySelector('#listPoke' + index);
            if (listItemElement) {
                const listItemNameElement = listItemElement.querySelector('.pokeListName');
                let hasChanged = (listItemNameElement.innerHTML !== `${poke.pokeName()} (${poke.level()})`) || (listItemNameElement.style.color !== this.pokeColor(poke));
                listItemNameElement.innerHTML = `${poke.pokeName()} (${poke.level()})`;
                listItemNameElement.style.color = this.pokeColor(poke);
                listItemNameElement.className = 'pokeListName'
                    + (poke === player.activePoke() ? ' activePoke' : '')
                    + (poke.canEvolve() ? ' canEvolve' : '');
                if (!purge && hasChanged) {
                    flash(listItemElement);
                }
            } else {
                const deleteButton = `<a href="#" onclick="userInteractions.deletePokemon(event, ${index});return false" class="pokeDeleteButton">X</a>`;
                const upButton = `<button onclick="userInteractions.pokemonToUp('${index}')" class="pokeUpButton"><i class="fa fa-arrow-up" aria-hidden="true"></i></button>`;
                const downButton = `<button onclick="userInteractions.pokemonToDown('${index}')" class="pokeDownButton"><i class="fa fa-arrow-down" aria-hidden="true"></i></button>`;
                const firstButton = `<button onclick="userInteractions.pokemonToFirst('${index}')" class="pokeFirstButton">#1</button>`;
                const evolveButton = `<button onclick="userInteractions.evolvePokemon('${index}')" class="pokeEvolveButton">Evolve</button>`;

                listElementsToAdd += `<li id="listPoke${index}">` +
                    deleteButton +
                    `<a href="#" onclick="userInteractions.changePokemon(${index})" style="color: ${this.pokeColor(poke)}" class="pokeListName">${poke.pokeName()} (${poke.level()})</a><br>` +
                    upButton +
                    downButton +
                    firstButton +
                    evolveButton +
                    `</li>`
            }
        });
        if (listElementsToAdd.length > 0) {
            this.setValue(listElement, listElementsToAdd, true)
        }
        let i = list.length;
        let listItemToRemove;
        while (listItemToRemove = listElement.querySelector('#listPoke' + i)) {
            listElement.removeChild(listItemToRemove);
            i++
        }
    },
    routeUnlocked: function(region, route) {
        const routeData = ROUTES[region][route];
        if (routeData.fishing && player.unlocked.fishing < routeData.fishing) {
            return false;
        }
        return true;
    },
    renderRouteSelect: function() {
        let selectHTML = '<option value="Kanto">Kanto</option>';
        let showList = false;
        for (let region in player.unlocked.regions) {
            if (player.unlocked.regions[region]) {
                selectHTML += '<option value="' + region + '"' + (player.settings.currentRegionId === region ? ' selected="true"' : '') + '>' + region + '</option>';
                showList = true;
            }
        }
        if (showList) {
            $('#regionSelect').innerHTML = selectHTML;
            $('#regionSelect').style.display = 'block';
        }
    },
    renderRouteList: function() {
        this.renderRouteSelect();
        const routes = ROUTES[player.settings.currentRegionId];
        const listElement = $('#routeList');
        $('#regionSelect').value = player.settings.currentRegionId;
        this.setValue(listElement, '');
        Object.keys(routes).forEach((routeId) => {
            const route = routes[routeId];
            const unlocked = this.routeUnlocked(player.settings.currentRegionId, routeId);
            const routeOnClick = (unlocked) ? 'userInteractions.changeRoute(\'' + routeId + '\')' : '';
            let routeColor, routeWeight;
            if (unlocked) {
                routeColor = (routeId === player.settings.currentRouteId) ? COLORS.route.current : COLORS.route.unlocked;
                routeWeight = (routeId === player.settings.currentRouteId) ? 'bold' : 'normal';
            } else {
                routeColor = COLORS.route.locked;
                routeWeight = 'normal';
            }
            const routeHTML = '<li><a href="#" onclick="' + routeOnClick + '" style="color: ' + routeColor + '; font-weight: ' + routeWeight + ';" >' + route.name + ' (' + route.minLevel + '~' + route.maxLevel + ')' + '</a></li>';
            this.setValue(listElement, routeHTML, true);
        })
    },
    renderListBox: function() {
        const routes = $('#routesBox');
        const roster = $('#rosterBox');
        const pokeDex = $('#pokedexBox');
        // which is showing
        if (player.settings.listView === 'routes') {
            routes.style.display = 'block';
            roster.style.display = 'none';
            pokeDex.style.display = 'none';
            this.renderRouteList();
        } else if (player.settings.listView === 'pokeDex') {
            routes.style.display = 'none';
            roster.style.display = 'none';
            pokeDex.style.display = 'block';
            this.renderPokeDex();
        } else {
            routes.style.display = 'none';
            roster.style.display = 'block';
            pokeDex.style.display = 'none';
            this.renderPokeList();

        }
    },
    checkConfirmed: function(id) {
        return $(id).checked
    },
    attackAnimation: function(id, direction) {
        const toAnimate = $('#' + id);
        toAnimate.classList = 'img attacked-' + direction;
        window.setTimeout(() => toAnimate.classList = 'img', 80)
    },
    gameConsoleLog: function(text, color) {
        if ($('#enableConsole').checked) {
            if (color) {
                this.logElement.innerHTML = '<span style="color:' + color + ';">' + text + '</span>' + '<br>' + this.logElement.innerHTML;
            } else {
                this.logElement.innerHTML = text + '<br>' + this.logElement.innerHTML;
            }
        }
        const logAsArray = this.logElement.innerHTML.split('<br>');
        if (logAsArray.length >= 100) {
            logAsArray.splice(logAsArray.length - 1, 1);
            this.logElement.innerHTML = logAsArray.join('<br>')
        }
    },
    gameConsoleClear: function() {
        this.logElement.innerHTML = ''
    },
    renderBalls: function() {
        Object.keys(player.ballsAmount).forEach(ballType => {
            $('.ball-ammount.' + ballType).innerHTML = player.ballsAmount[ballType];
        })
    },
    renderCurrency: function() {
        const currencyElement = $('#currency');
        currencyElement.innerHTML = '¤' + player.currency;
        flash(currencyElement);
    },
    refreshCatchOption: function(setCatchOption) {
        $(`#enableCatchNew`).checked = false;
        $(`#enableCatchAll`).checked = false;
        if (setCatchOption === 'new') {
            $(`#enableCatchNew`).checked = true;
        } else if (setCatchOption === 'all') {
            $(`#enableCatchAll`).checked = true;
        }
        userInteractions.changeCatchOption(setCatchOption);
    },
    bindEvents: function() {
        $('#enableDelete').addEventListener( 'click', () => {
            userInteractions.enablePokeListDelete();
        });
        $('#autoSort').addEventListener( 'click', () => {
            userInteractions.enablePokeListAutoSort();
        });
        $('#viewRoutes').addEventListener( 'click', () => {
            userInteractions.changeListView('routes');
        });
        $('#viewRoster').addEventListener( 'click', () => {
            userInteractions.changeListView('roster');
        });
        $('#viewPokeDex').addEventListener( 'click', () => {
            userInteractions.changeListView('pokeDex');
        });

        $('#dexView').addEventListener( 'change'
            , () => { userInteractions.changeDexView() }
        );

        $(`#enableCatchAll`).addEventListener( 'click'
            , () => { var setCatchSetting;
                if ($(`#enableCatchAll`).checked) {
                    $(`#enableCatchNew`).checked = false;
                    setCatchSetting = 'all';
                } else {
                    setCatchSetting = false;
                }
                player.settings.catching = setCatchSetting;
                userInteractions.changeCatchOption(setCatchSetting);
            }
        );

        $(`#enableCatchNew`).addEventListener( 'click'
            , () => { var setCatchSetting;
                if ($(`#enableCatchNew`).checked) {
                    $(`#enableCatchAll`).checked = false;
                    setCatchSetting = 'new';
                } else {
                    setCatchSetting = false;
                }
                player.settings.catching = setCatchSetting;
                userInteractions.changeCatchOption(setCatchSetting);
            }
        );

        $(`#saveDialogContainer`).addEventListener( 'click'
            , (event) => { event.target === $(`#saveDialogContainer`) && ($(`#saveDialogContainer`).style.display = 'none'); }
        );

        $(`#statisticsContainer`).addEventListener( 'click'
            , (event) => { event.target === $(`#statisticsContainer`) && ($(`#statisticsContainer`).style.display = 'none'); }
        );

        $(`#settingsContainer`).addEventListener( 'click'
            , (event) => { event.target === $(`#settingsContainer`) && ($(`#settingsContainer`).style.display = 'none'); }
        );

        $(`#achievementsContainer`).addEventListener( 'click'
            , (event) => { event.target === $(`#achievementsContainer`) && ($(`#achievementsContainer`).style.display = 'none'); }
        );

        $(`#townContainer`).addEventListener( 'click'
            , (event) => { event.target === $(`#townContainer`) && ($(`#townContainer`).style.display = 'none'); }
        );
    }
};

const renderView = (dom, enemy, player, purge = true) => {
    dom.renderPokeOnContainer('enemy', enemy.activePoke());
    dom.renderPokeOnContainer('player', player.activePoke(), player.settings.spriteChoice || 'back');
};