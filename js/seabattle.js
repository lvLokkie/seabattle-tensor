'use strict';

//Новая версия j-Query не поддерживает addClass :(
function SeaBattle(targetContainer, edge) {
    //Список css-классов
    var cssClasses = {
        container: 'container',
        block: 'block',
        area: 'area',
        seaContainer: 'seaContainer',
        sea: 'sea',
        messagesLog: 'messages',
        message: 'message',
        cell: 'cell',
        cellDead: 'dead',
        cellBoat: 'boat',
        cellWater: 'water',
        cellMiss: 'miss'
    };

    //Список идентификаторов
    var elementsIds = {
        gameContainer: 'game_container',
        playerName: 'player_name',
        computerName: 'computer_name',
        playerSeaContainer: 'player_field',
        playerSea: 'player_sea',
        computerSeaContainer: 'computer_field',
        computerSea: 'computer_sea',
        messagesLog: 'messages',
        cellIdPrefix: 'cell_',
        rowIdPrefix: 'row_'
    };

    //Список игроков
    var players = {
        Player: 'player',
        Computer: 'computer'
    };

    //Статусы ячеек на карте
    var cellType = {
        dead: 1,
        ship: 0,
        water: -1,
        miss: 2
    };

    //Завершена ли игра
    var gameEnded = false;

    //Поле с сообщениями
    var messagesArea;

    //Карты полей боя игроков
    var computerMap, playerMap;

    //Лог выстрелов компьютера
    var computerShots;

    //Имена игроков
    var playerName, computerName;

    //Список кораблей и их координат у игроков
    var playerShips, computerShips;

    //Список сторон, на которых можно расположить корабль
    var possibleDirections = ['top', 'bottom', 'right', 'left'];

    //Получаем html-текст поля ввода с именем игрока
    var getPlayerNameInputHtml = function (id, defaultName, title, placeholder, autofocus) {
        return $('<input>')
            .attr('id', id)
            .attr('type', 'text')
            .attr('placeholder', placeholder)
            .attr('title', title)
            .attr('autofocus', autofocus ? 'true' : 'false')
            .attr('value', defaultName)
            .prop('outerHTML');
    };

    //Сложение строк через разделитель
    var concat = function (firstString, secondString, delimeter) {
        return firstString.concat((delimeter || ' ') + secondString);
    };

    //Получаем игровое поле для указанного игрока
    var getSeaArea = function (id, labelValue, inputId, inputDefaultValue, inputTitle, inputPlaceholder, inputAutoFocus) {
        return $('<div>')
            .attr('class', cssClasses.block)
            .append(
                $('<label>')
                    .attr('for', id)
                    .html(
                        concat(
                            labelValue,
                            getPlayerNameInputHtml(
                                inputId,
                                inputDefaultValue,
                                inputTitle,
                                inputPlaceholder,
                                inputAutoFocus)
                        )
                    )
            )
            .append(
                $('<div>')
                    .attr('id', id)
                    .attr('class', concat(cssClasses.area, cssClasses.seaContainer))
            );
    };

    //Получаем поле с сообщениями
    var getMessagesArea = function () {
        return $('<div>')
            .attr('class', cssClasses.block)
            .append(
                $('<label>')
                    .attr('for', elementsIds.messagesLog)
                    .html('Сообщения:')
            )
            .append(
                $('<div>')
                    .attr('id', elementsIds.messagesLog)
                    .attr('class', concat(cssClasses.area, cssClasses.messagesLog))
            );
    };

    //Получить текущие дату и время в читаемой строке
    var getCurrentDateTimeString = function () {
        var delimiter = '.';
        var currentDateTime = new Date();
        return currentDateTime.getDate() + delimiter
            + (currentDateTime.getMonth() + 1) + delimiter
            + currentDateTime.getFullYear() + ' '
            + currentDateTime.getHours() + delimiter
            + currentDateTime.getMinutes();
    };

    //Добавить новое сообщение
    var createMessage = function (text, colorClass) {
        $('#' + elementsIds.messagesLog).prepend(
            $('<p>')
                .attr('class', concat(cssClasses.message, colorClass))
                .html(concat(getCurrentDateTimeString(), text, ' : '))
        );
    };

    //Получить поле, содежащее игру
    var getGameContainer = function () {
        var gameContainer = $('<div>')
            .attr('id', elementsIds.gameContainer)
            .attr('class', cssClasses.container)
            .append($('<h1>').html('Морской бой'));

        gameContainer
            .append(
                getSeaArea(
                    elementsIds.playerSeaContainer,
                    'Ваше поле,',
                    elementsIds.playerName,
                    'Игрок',
                    'Имя игрока',
                    'Введите ваше имя',
                    true
                )
            ).append(
            getSeaArea(
                elementsIds.computerSeaContainer,
                'Противник',
                elementsIds.computerName,
                'Компьютер',
                'Имя компьютера',
                'Введите имя компьютера',
                false
            )
        ).append(
            getMessagesArea()
        );

        return gameContainer;
    };

    //Отрисовать контейнер игры внутри указанного элемента
    var drawGameContainer = function (target) {
        target.empty();
        target.append(getGameContainer());
    };

    //Получить имя игрока
    var getPlayerName = function () {
        return $('#' + elementsIds.playerName).val();
    };

    //Получить имя компьтера
    var getComputerName = function () {
        return $('#' + elementsIds.computerName).val();
    };

    //Получить случайно целое число  в интервале
    var getRandomIntBetween = function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    //Построить пустую карту с указанной шириной грани
    var createEmptyShipsMap = function () {
        var emptyMap = [];
        for (var x = 1; x <= edge; x++) {
            emptyMap[x] = [];
            for (var y = 1; y <= edge; y++) {
                emptyMap[x][y] = cellType.water;
            }
        }
        return emptyMap;
    };

    //Проверить, свободны ли ячейка и её окрестности от кораблей
    var cellRangeIsFree = function (map, cell_x, cell_y) {
        if (map[cell_x] && map[cell_x][cell_y]) {
            var coordinate_x, coordinate_y;
            for (var x = -1; x <= 1; x++) {
                for (var y = -1; y <= 1; y++) {
                    coordinate_x = cell_x + x;
                    coordinate_y = cell_y + y;
                    if (map[coordinate_x]
                        && map[coordinate_x][coordinate_y] == cellType.ship) {
                        return false;
                    }
                }
            }
            return true;
        }
        return false;
    };

    //Проверить возможность размещения судна в определенном направлении
    var checkDirection = function (map, direction, x, y, shipLength) {
        var lastCoordinate;
        switch (direction) {
            //1 буква переменной => 1 буква направления
            case 'top':
                lastCoordinate = x + shipLength;
                if (lastCoordinate <= edge) {
                    for (var tx = x; tx < lastCoordinate; tx++) {
                        if (!cellRangeIsFree(map, tx, y)) {
                            return false;
                        }
                    }
                }
                else {
                    return false;
                }
                break;
            case 'bottom':
                lastCoordinate = x - shipLength;
                if (lastCoordinate < 0) {
                    for (var bx = x; bx > lastCoordinate; bx--) {
                        if (!cellRangeIsFree(map, bx, y)) {
                            return false;
                        }
                    }
                }
                else {
                    return false;
                }
                break;
            case 'left':
                lastCoordinate = y - shipLength;
                if (lastCoordinate < 0) {
                    for (var ly = y; ly > lastCoordinate; ly--) {
                        if (!cellRangeIsFree(map, x, ly)) {
                            return false;
                        }
                    }
                }
                else {
                    return false;

                }
                break;
            case 'right':
                lastCoordinate = y + shipLength;
                if (lastCoordinate < edge) {
                    for (var ry = y; ry < lastCoordinate; ry++) {
                        if (!cellRangeIsFree(map, x, ry)) {
                            return false;
                        }
                    }
                }
                else {
                    return false;
                }
                break;
        }
        return true;
    };

    //Проверить направления для размещения судна в случайном порядке
    var getRandomValidDirection = function (map, x, y, shipLength) {
        var directionsArray = possibleDirections;
        var currentDirection;
        for (var i = directionsArray.length - 1; i >= 0; i--) {
            var index = getRandomIntBetween(0, directionsArray.length - 1);
            currentDirection = directionsArray[index];
            directionsArray.slice(index, 1);
            switch (currentDirection) {
                case 'top':
                    if (checkDirection(map, currentDirection, x, y, shipLength)) {
                        return currentDirection;
                    }
                    break;
                case 'bottom':
                    if (checkDirection(map, currentDirection, x, y, shipLength)) {
                        return currentDirection;
                    }
                    break;
                case 'left':
                    if (checkDirection(map, currentDirection, x, y, shipLength)) {
                        return currentDirection;
                    }
                    break;
                case 'right':
                    if (checkDirection(map, currentDirection, x, y, shipLength)) {
                        return currentDirection;
                    }
                    break;
            }
        }
        return null;
    };

    //Разместить лодку на карте
    var placeShipToMap = function (map, direction, x, y, shipLength, owner) {
        var lastCoordinate;
        var ship = [];
        switch (direction) {
            case 'top':
                lastCoordinate = x + shipLength;
                for (var tx = x; tx < lastCoordinate; tx++) {
                    ship.push([tx, y]);
                    map[tx][y] = cellType.ship;
                }
                break;
            case 'bottom':
                lastCoordinate = x - shipLength;
                for (var bx = x; bx > lastCoordinate; bx--) {
                    ship.push([bx, y]);
                    map[bx][y] = cellType.ship;
                }
                break;
            case 'left':
                lastCoordinate = y - shipLength;
                for (var ly = y; ly > lastCoordinate; ly--) {
                    ship.push([x, ly]);
                    map[x][ly] = cellType.ship;
                }
                break;
            case 'right':
                lastCoordinate = y + shipLength;
                for (var ry = y; ry < lastCoordinate; ry++) {
                    ship.push([x, ry]);
                    map[x][ry] = cellType.ship;
                }
                break;
            case 'single': {
                ship.push([x, y]);
                map[x][y] = cellType.ship;
                break;
            }
        }
        //Добавляем в список кораблей игрока
        if (owner == players.Player) {
            if (!playerShips) {
                playerShips = [];
            }
            playerShips.push(ship);
        }
        else {
            if (!computerShips) {
                computerShips = [];
            }
            computerShips.push(ship);
        }
        return map;
    };

    //Создать карту размещения судов на поле
    var makeMap = function (map, owner) {
        for (var shipLength = 4; shipLength > 0; shipLength--) {
            for (var shipsCount = 1; shipsCount <= 5 - shipLength; shipsCount++) {
                var notReady = true;
                while (notReady) {
                    var x = getRandomIntBetween(1, edge);
                    var y = getRandomIntBetween(1, edge);
                    notReady = false;
                    if (cellRangeIsFree(map, x, y)) {
                        if (shipLength > 1) {
                            var direction = getRandomValidDirection(map, x, y, shipLength);
                            if (direction) {
                                map = placeShipToMap(map, direction, x, y, shipLength, owner);
                            }
                            else {
                                notReady = true;
                            }
                        }
                        else {
                            map = placeShipToMap(map, 'single', x, y, shipLength, owner);
                        }
                    }
                    else {
                        notReady = true;
                    }
                }

            }
        }
        return map;
    };

    //Найти ячейку с кораблем и удалить её из списка ячеек кораблей
    var _hitShip = function (ships, x, y) {
        var bufferShips = ships;
        var indexCoordinateX = 0, indexCoordinateY = 1;
        for (var i = 0; i < bufferShips.length; i++) {
            for (var shipCoordinateIndex = 0; shipCoordinateIndex < bufferShips[i].length; shipCoordinateIndex++) {
                if (bufferShips[i][shipCoordinateIndex][indexCoordinateX] == x
                    && bufferShips[i][shipCoordinateIndex][indexCoordinateY] == y) {
                    //Удаляем координату корабля
                    bufferShips[i].splice(shipCoordinateIndex, 1);
                    //Если ячеек не соталось - удаляем массив - корабль
                    if (bufferShips[i].length == 0) {
                        bufferShips.splice(i, 1);
                        return bufferShips;
                    }
                }
            }
        }
        return bufferShips;
    };

    //Нарисуем промахи вокруг ячейки
    var _drawMissesAroundCell = function (map, owner, cell_x, cell_y) {
        console.log(cell_x, cell_y);
        for (var x = -1; x <= 1; x++) {
            var coordinate_x = cell_x + x;
            for (var y = -1; y <= 1; y++) {
                var coordinate_y = cell_y + y;
                if (x == 0 && y == 0) {
                    continue;
                }
                if (map[coordinate_x] && map[coordinate_x][coordinate_y]) {
                    if (map[coordinate_x][coordinate_y] == cellType.water) {
                        map[coordinate_x][coordinate_y] = cellType.miss;
                        $('td[data-owner="' + owner + '"][data-x="' + coordinate_x + '"][data-y="' + coordinate_y + '"]')
                            .attr('class', concat(cssClasses.cell, cssClasses.miss));
                    }
                }
            }
        }
    };

    //Получить координаты лодки, в которую входит данная ячейка
    var getShipCoordinates = function (map, cell_x, cell_y) {
        var coordinates = [];
        for (var x = -1; x <= 1; x++) {
            var coordinate_x = cell_x + x;

            for (var y = -1; y <= 1; y++) {
                var coordinate_y = cell_y + y;

                if (x == 0 && y == 0) {
                    coordinates.push([coordinate_x, coordinate_y]);
                    continue;
                }
                if (x == 0 || y == 0) {
                    if (map[coordinate_x] && map[coordinate_x][coordinate_y]) {
                        if (map[coordinate_x][coordinate_y] == cellType.ship || map[coordinate_x][coordinate_y] == cellType.dead) {
                            if (y == 0) {
                                for (var ix = coordinate_x; ix <= (coordinate_x + 4*x); ix = x > 0 ? ix - 1 : ix + 1) {
                                    if (ix > 0 && ix <= 10) {
                                        if (map[ix][coordinate_y] == cellType.ship || map[ix][coordinate_y] == cellType.dead) {
                                            coordinates.push([ix, coordinate_y]);
                                        }
                                        else
                                        {
                                            break;
                                        }
                                    }
                                }
                            }
                            else {
                                for (var iy = coordinate_y; iy <= (coordinate_y + 4*x); iy = x > 0 ? iy - 1 : iy + 1) {
                                    if (iy > 0 && iy <= 10) {
                                        if (map[coordinate_x][iy] == cellType.ship || map[coordinate_x][iy] == cellType.dead) {
                                            coordinates.push([coordinate_x, iy]);
                                        }
                                        else
                                        {
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

            }
        }
        return coordinates;
    };

    //Нарисовать промахи вокруг мертвого корабля
    var drawMissesAroundDeadShip = function (map, owner, x, y) {
        var coordinates = getShipCoordinates(map, x, y);
        for (var i = 0; i < coordinates.length; i++) {
            _drawMissesAroundCell(map, owner, coordinates[i][0], coordinates[i][1]);
        }
    };

    //Обработка выстрела в списке кораблей игрока
    var hitShip = function (target, x, y) {
        var shipsCount;
        var isDead;
        var message;
        if (target == players.Player) {
            shipsCount = playerShips.length;
            playerShips = _hitShip(playerShips, x, y);
            if (playerMap[x][y] == cellType.water)
                playerMap[x][y] = cellType.miss;
            else if (playerMap[x][y] == cellType.ship)
                playerMap[x][y] = cellType.dead;
            isDead = shipsCount != playerShips.length;
            if (isDead) {
                message = 'Наш корабль уничтожен!';
                createMessage(message);
                alert(message);
                drawMissesAroundDeadShip(playerMap, players.Player, x, y);
                if (playerShips.length == 0) {
                    gameEnded = true;
                    alert('Компьтер уничтожил все ваши корабли');
                    createMessage('Вы проиграли :с Не расстраивайтесь, мы вас любим. Пожалуйста, обновите страницу.');
                }
            }
            return isDead;
        }
        else if (target == players.Computer) {
            shipsCount = computerShips.length;
            computerShips = _hitShip(computerShips, x, y);
            if (computerMap[x][y] == cellType.water)
                computerMap[x][y] = cellType.miss;
            else if (computerMap[x][y] == cellType.ship)
                computerMap[x][y] = cellType.dead;
            isDead = shipsCount != computerShips.length;
            if (isDead) {
                message = 'Мы уничтожили корабль противника!';
                createMessage(message);
                alert(message);
                drawMissesAroundDeadShip(computerMap, players.Computer, x, y);
                if (computerShips.length == 0) {
                    gameEnded = true;
                    alert('Поздравляю, вы восхитительны! Победа!');
                    createMessage('Капитан, мы мы сочинили песню о вашей победе. Хотите послушать? Пожалуйста, обновите страницу.');
                }
            }
            return isDead;
        }
    };

    //Выстрел компьтера
    var computerShot = function () {
        var targets = $('td:not(.' + cssClasses.miss + ')[data-owner="' + players.Player + '"]');
        var targetIndex = getRandomIntBetween(0, targets.length - 1);
        var target = $(targets[targetIndex]);
        var x, y;
        x = target.attr('data-x');
        y = target.attr('data-y');
        hitShip(players.Player, x, y);
        drawShot(players.Player, x, y);
    };


    //Обработка выстрела игрока
    var fire = function (target, x, y) {
        if (!gameEnded) {
            if (target != players.Player) {
                //Если уже попадал или мазал то ничего не делаем
                if (computerMap[x][y] != cellType.dead && computerMap[x][y] != cellType.miss) {
                    hitShip(target, x, y);
                    drawShot(target, x, y);

                    //Ответный выстрел компьтера
                    setTimeout(computerShot(), 500)
                }
                else {
                    createMessage('Капитан, мы уже сюда стреляли! Предлагаю изменить координаты.');
                }
            }
            else {
                createMessage('Капитан, это наше поле :с');
            }
        }
        else {
            createMessage('Игра завершена! Пожалуйста, обновите страницу.');
        }
    };

    //отрисовать выстрел компьтера по координатам
    var drawComputerShot = function (cell, x, y) {
        if (playerMap[x][y] == cellType.dead) {
            createMessage(getComputerName() + ' попал в ваш корабль! ' + getCellName(x, y) + ' горит!');
            cell.attr('class', cssClasses.cellDead);
        }
        else if (playerMap[x][y] == cellType.miss) {
            playerMap[x][y] = cellType.miss;
            createMessage(getComputerName() + ' промахнулся в ' + getCellName(x, y) + '! Так держать, капитан!');
            cell.attr('class', cssClasses.cellMiss);
        }
    };

    //Отрисовать выстрел игрока по координатам
    var drawPlayerShot = function (cell, x, y) {
        if (computerMap[x][y] == cellType.dead) {
            createMessage('Капитан, ' + getPlayerName() + ', цель ' + getCellName(x, y) + ' поражена!');
            cell.attr('class', cssClasses.cellDead);
        }
        else if (computerMap[x][y] == cellType.miss) {
            createMessage('Капитан, ' + getPlayerName() + ', промах по ' + getCellName(x, y) + '. Противник разгадал наши планы.');
            cell.attr('class', cssClasses.cellMiss);
        }
    };

    //Отрисовать выстрел в ячейку по координатам
    var drawShot = function (target, x, y) {
        var cell = $('td[data-owner="' + target + '"][data-x="' + x + '"][data-y="' + y + '"]');
        if (target == players.Player) {
            drawComputerShot(cell, x, y);
        }
        else if (target == players.Computer) {
            drawPlayerShot(cell, x, y);
        }
    };

    //Получить строковое имя ячейки
    var getCellName = function (x, y) {
        //Английская А имеет код 64
        return String.fromCharCode(64 + y) + x;
    };

    //Получить ячейку с указанным классом
    var _getTableCell = function (x, y, type, owner) {
        var cell = $('<td>')
            .attr('id', elementsIds.cellIdPrefix + owner + '_' + x + '_' + y)
            .attr('data-owner', owner)
            .attr('data-x', x)
            .attr('data-y', y)
            .attr('title', getCellName(x, y));

        cell.click(function () {
            fire(owner, x, y);
        });

        switch (type) {
            case cssClasses.cellWater:
                cell.attr('class', concat(cssClasses.cell, cssClasses.cellWater));
                break;
            case cssClasses.cellMiss:
                cell.attr('class', concat(cssClasses.cell, cssClasses.cellMiss));
                break;
            case cssClasses.cellBoat:
                cell.attr('class', concat(cssClasses.cell, cssClasses.cellBoat));
                break;
            case cssClasses.cellDead:
                cell.attr('class', concat(cssClasses.cell, cssClasses.cellDead));
                break;
        }
        return cell;
    };

    //Получить сформирвоанную таблицу с морем
    var _getSea = function (seaId, owner, map, showBoats) {
        var seaContainer = $('<table>')
            .attr('id', seaId)
            .attr('class', cssClasses.sea);

        for (var x = 1; x < map.length; x++) {

            var tr = $('<tr>').attr('id', concat(elementsIds.rowIdPrefix, x, ''));
            for (var y = 1; y < map[x].length; y++) {
                if (showBoats) {
                    if (map[x][y] == 0) {
                        tr.append(_getTableCell(x, y, cssClasses.cellBoat, owner));
                    }
                    else {
                        tr.append(_getTableCell(x, y, cssClasses.cellWater, owner));
                    }
                }
                else {
                    tr.append(_getTableCell(x, y, cssClasses.cellWater, owner));
                }
            }
            seaContainer.append(tr);
        }
        return seaContainer;
    };

    //Поместить поле боя в контейнер
    var _drawSea = function (id, map, owner, target, showBoats) {
        var sea = _getSea(id, owner, map, showBoats);
        target.empty();
        target.append(sea);
    };

    playerMap = createEmptyShipsMap();
    computerMap = createEmptyShipsMap();


    return {

        //Инициализация игры
        init: function () {
            drawGameContainer(targetContainer);
            createMessage('Добро пожаловать в морской бой!');
            playerMap = makeMap(playerMap, players.Player);
            computerMap = makeMap(computerMap, players.Computer);
            _drawSea(elementsIds.playerSea, playerMap, players.Player, $('#' + elementsIds.playerSeaContainer), true);
            _drawSea(elementsIds.computerSea, computerMap, players.Computer, $('#' + elementsIds.computerSeaContainer));
        }


    }

}
