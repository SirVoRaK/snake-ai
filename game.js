'use strict'

const boardSize = 16

const games = []

const gamesDiv = document.querySelector('.games')

const runningP = document.querySelector('.total span')
const winP = document.querySelector('.win span')
const lostP = document.querySelector('.lost span')
const percentageP = document.querySelector('.percentage span')

const total = 20
runningP.textContent = total
for (let i = 0; i < total; i++) {
    const div = document.createElement('div')
    div.className = 'game'

    const canvas = document.createElement('canvas')
    div.appendChild(canvas)

    const textDiv = document.createElement('div')

    const movesP = document.createElement('p')
    const elapsedP = document.createElement('p')
    const finishedP = document.createElement('p')

    movesP.textContent = '0 moves'
    elapsedP.textContent = 'running'
    finishedP.textContent = 'not finished'

    textDiv.appendChild(movesP)
    textDiv.appendChild(elapsedP)
    textDiv.appendChild(finishedP)

    div.appendChild(textDiv)

    gamesDiv.appendChild(div)

    games.push(
        Game({
            canvas: canvas,
            movesP: movesP,
            elapsedP: elapsedP,
            finishedP: finishedP,
        })
    )
}

function Game(elements) {
    const { canvas, movesP, elapsedP, finishedP } = elements

    const ctx = canvas.getContext('2d')
    const board = {
        width: boardSize,
        height: boardSize,
    }

    const timer = {
        start: 0,
        end: 0,
        elapsed: 0,
    }

    const tileSize = 15

    canvas.width = board.width * tileSize
    canvas.height = board.height * tileSize

    const collision = {
        fruit: 0,
        tail: 1,
        wall: 2,
    }

    const snake = {
        direction: '',
        speed: 0,
        tail: [],
        head: {
            x: board.width / 2,
            y: board.height / 2,
        },
        moves: 0,
    }

    let stop = false

    const fruits = []

    const moves = {
        right() {
            snake.head.x++
        },
        left() {
            snake.head.x--
        },
        up() {
            snake.head.y--
        },
        down() {
            snake.head.y++
        },
    }

    function reset() {
        snake.direction = ''
        stop = true
        return
        snake.head = {
            x: board.width / 2,
            y: board.height / 2,
        }
        snake.direction = ''
        snake.tail.length = 0
        fruits.length = 0
        spawnFruit()
    }

    function willCollide(position) {
        const collidedTail = snake.tail.find(
            (tail) => tail.x === position.x && tail.y === position.y
        )
        if (collidedTail) return true

        return false
    }

    function newDir() {
        const { x, y } = snake.head
        const arr = []
        for (const key in allowedMoves[x][y]) {
            if (allowedMoves[x][y][key]) arr.push(key)
        }
        if (arr.length === 1) return arr[0]

        const posAfterMove0 = positionAfterMove(arr[0])
        if (willCollide(posAfterMove0)) return arr[1]
        const posAfterMove1 = positionAfterMove(arr[1])
        if (willCollide(posAfterMove1)) return arr[0]

        if (distance(posAfterMove0, fruits[0]) < distance(posAfterMove1, fruits[0])) {
            return arr[0]
        } else if (distance(posAfterMove0, fruits[0]) > distance(posAfterMove1, fruits[0])) {
            return arr[1]
        } else {
            return arr[Math.floor(Math.random() * 2)]
        }
    }

    function distance(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
    }

    function positionAfterMove(direction) {
        const { x, y } = snake.head
        switch (direction) {
            case 'right':
                return { x: x + 1, y }
            case 'left':
                return { x: x - 1, y }
            case 'up':
                return { x, y: y - 1 }
            case 'down':
                return { x, y: y + 1 }
        }
    }

    function gameLoop() {
        snake.direction = newDir()
        const exec = moves[snake.direction]
        if (exec && !stop) {
            snake.tail.push({
                x: snake.head.x,
                y: snake.head.y,
            })
            exec()
            snake.moves++
            updateUi()
            const curCollision = checkCollision()

            if (curCollision === 1) {
                finishedP.textContent = 'lost'
                lostP.textContent = +lostP.textContent + 1
                elapsedP.parentElement.parentElement.classList.add('lost')
            }

            if (curCollision === collision.fruit) {
                const fruitIndex = fruits.findIndex(
                    (fruit) => snake.head.x === fruit.x && snake.head.y === fruit.y
                )
                fruits.splice(fruitIndex, 1)
                if (snake.tail.length + 1 >= board.width * board.height) {
                    stop = true
                    finishedP.textContent = 'win'
                    winP.textContent = +winP.textContent + 1
                } else {
                    spawnFruit()
                }
            } else {
                snake.tail.shift()
            }

            if (curCollision === collision.wall || curCollision === collision.tail) {
                reset()
            }
        } else {
            timer.end = Date.now()
            timer.elapsed = timer.end - timer.start
            elapsedP.textContent = timer.elapsed / 1000 + ' seconds'
            elapsedP.parentElement.parentElement.classList.toggle(
                'win',
                !elapsedP.parentElement.parentElement.classList.contains('lost')
            )
            calculateWinRate()
            return
        }
        draw()
        setTimeout(gameLoop, snake.speed)
    }

    function updateUi() {
        movesP.textContent = snake.moves + ' moves'
    }

    function calculateWinRate() {
        const wins = +winP.innerText
        const loses = +lostP.innerText
        const total = +runningP.textContent

        const winRate = (wins / total) * 100
        percentageP.textContent = winRate.toFixed(2)
    }

    function checkCollision() {
        const collidedFruit = fruits.find(
            (fruit) => fruit.x === snake.head.x && fruit.y === snake.head.y
        )
        if (collidedFruit) return collision.fruit

        const collidedTail = snake.tail.find(
            (tail) => tail.x === snake.head.x && tail.y === snake.head.y
        )
        if (collidedTail) return collision.tail

        if (snake.head.x < 0 || snake.head.x >= board.width) return collision.wall
        if (snake.head.y < 0 || snake.head.y >= board.height) return collision.wall

        return false
    }

    function spawnFruit() {
        const fruit = {
            x: Math.floor(Math.random() * board.width),
            y: Math.floor(Math.random() * board.height),
        }

        const collided = fruits.find(
            (fruit) => fruit.x === snake.head.x && fruit.y === snake.head.y
        )
        const collidedTailWithFruit = snake.tail.find(
            (tail) => tail.x === fruit.x && tail.y === fruit.y
        )
        const collidedHead = snake.head.x === fruit.x && snake.head.y === fruit.y
        if (!collided && !collidedTailWithFruit && !collidedHead) {
            fruits.push(fruit)
        } else {
            spawnFruit()
        }
    }

    const direction = {
        d: 'right',
        w: 'up',
        a: 'left',
        s: 'down',
        ArrowDown: 'down',
        ArrowUp: 'up',
        ArrowLeft: 'left',
        ArrowRight: 'right',
    }

    const ai = true

    document.addEventListener('keydown', (e) => {
        if (ai) return
        const newDirection = direction[e.key]
        if (newDirection && newDirection !== snake.direction) {
            snake.direction = newDirection
        }
    })

    class Move {
        left = false
        right = false
        up = false
        down = false
    }

    const allowedMoves = []
    for (let i = 0; i < board.width; i++) {
        allowedMoves.push([])
        for (let j = 0; j < board.height; j++) {
            allowedMoves[i].push(new Move())
        }
    }
    for (let i = 0; i < allowedMoves.length; i++) {
        if (i % 2 === 0) {
            for (let j = 0; j < allowedMoves[i].length; j++) {
                if (j > 0) {
                    allowedMoves[j][i].left = true
                }
                if (j < allowedMoves[i].length - 1) {
                    allowedMoves[i][j].down = true
                }
            }
        } else {
            for (let j = 0; j < allowedMoves[i].length; j++) {
                if (j < allowedMoves[i].length - 1) {
                    allowedMoves[j][i].right = true
                }
                if (j > 0) {
                    allowedMoves[i][j].up = true
                }
            }
        }
    }

    function draw() {
        //clear
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        //fruits
        for (let i = 0; i < fruits.length; i++) {
            ctx.fillStyle = 'hsl(0, 60%, 60%)'
            ctx.fillRect(fruits[i].x * tileSize, fruits[i].y * tileSize, tileSize, tileSize)
        }
        //tail
        for (let i = 0; i < snake.tail.length; i++) {
            ctx.fillStyle = 'hsl(120, 100%, 30%)'
            ctx.fillRect(snake.tail[i].x * tileSize, snake.tail[i].y * tileSize, tileSize, tileSize)
        }

        //head
        ctx.fillStyle = 'hsl(120, 100%, 50%)'
        ctx.fillRect(snake.head.x * tileSize, snake.head.y * tileSize, tileSize, tileSize)

        // requestAnimationFrame(draw)
    }
    draw()
    spawnFruit()
    gameLoop()
    timer.start = Date.now()
}
