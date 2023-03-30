//Настройки canvas
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
//Dom element score
const scorePoint = document.getElementById('scorePoint')
// Default radius of player and ghost
const circleDefaultRadius = 16
//Шаблон карты
const map = [
	['1', '-', '-', '-', '-', '-', '-', '-', '-', '-', '2'],
	['|', '.', '.', '.', '.', '.', '.', '.', '.', '.', '|'],
	['|', '.', 'b', '.', '[', '5', ']', '.', 'b', '.', '|'],
	['|', '.', '.', '.', '.', '_', '.', '.', '.', '.', '|'],
	['|', '.', '[', ']', '.', '.', '.', '[', ']', '.', '|'],
	['|', '.', '.', '.', '.', '^', '.', '.', '.', '.', '|'],
	['|', '.', 'b', '.', '[', 'x', ']', '.', 'b', '.', '|'],
	['|', '.', '.', '.', '.', '_', '.', '.', '.', '.', '|'],
	['|', '.', '[', ']', '.', '.', '.', '[', ']', '.', '|'],
	['|', '.', '.', '.', '.', '^', '.', '.', '.', '.', '|'],
	['|', '.', 'b', '.', '[', '6', ']', '.', 'b', '.', '|'],
	['|', '.', '.', '.', '.', '.', '.', '.', '.', 'p', '|'],
	['4', '-', '-', '-', '-', '-', '-', '-', '-', '-', '3'],
]
//Состояние нажимаемых клавиш
const keys = {
	w: {
		pressed: false,
	},
	a: {
		pressed: false,
	},
	s: {
		pressed: false,
	},
	d: {
		pressed: false,
	},
}
//Последняя нажатая клавиша
let lastKey = ''

// full size canvas
canvas.width = innerWidth
canvas.height = innerHeight

//Класс блоков карты
class Boundary {
	static width = 40
	static height = 40
	constructor({ position, image }) {
		this.position = position
		this.height = Boundary.height
		this.width = Boundary.width
		this.image = image
	}
	draw() {
		c.drawImage(this.image, this.position.x, this.position.y)
	}
}
//Коллекция блоков карты
const boundaries = []

//Класс игрока
class Player {
	constructor({ position, velocity, speed }) {
		this.position = position
		this.velocity = velocity
		this.radius = circleDefaultRadius
		this.speed = 2
		this.score = 0
		this.radians = 0.75
		this.openRate = 0.05
		this.rotation = 0
	}
	draw() {
		c.save()
		c.translate(this.position.x, this.position.y)
		c.rotate(this.rotation)
		c.translate(-this.position.x, -this.position.y)
		c.beginPath()
		c.arc(
			this.position.x,
			this.position.y,
			this.radius,
			this.radians,
			Math.PI * 2 - this.radians
		)
		c.lineTo(this.position.x, this.position.y)
		c.fillStyle = 'yellow'
		c.fill()
		c.closePath()
		c.restore()
	}
	update() {
		this.draw()
		this.position.x += this.velocity.x
		this.position.y += this.velocity.y

		if (this.radians < 0 || this.radians > 0.75) {
			this.openRate = -this.openRate
		}

		this.radians += this.openRate
	}
	updateScore(i) {
		this.score += i
		scorePoint.textContent = this.score
	}
}

const player = new Player({
	position: {
		x: Boundary.width + Boundary.width / 2,
		y: Boundary.height + Boundary.height / 2,
	},
	velocity: {
		x: 0,
		y: 0,
	},
})

//Класс призраков
class Ghost {
	static defaultSpeed = 2
	static timeToScaredDefault = 6000
	constructor({ position, velocity, color = 'red' }) {
		this.position = position
		this.velocity = velocity
		this.radius = circleDefaultRadius
		this.speed = Ghost.defaultSpeed
		this.color = color
		this.prevCollisions = []
		this.scared = false
	}
	draw() {
		c.beginPath()
		c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
		c.fillStyle = this.scared ? 'blue' : this.color
		c.fill()
		c.closePath()
	}
	update() {
		this.draw()
		this.position.x += this.velocity.x
		this.position.y += this.velocity.y
	}
}
const ghosts = [
	new Ghost({
		position: {
			x: Boundary.width * 6 + Boundary.width / 2,
			y: Boundary.height + Boundary.height / 2,
		},
		velocity: {
			x: Ghost.defaultSpeed,
			y: 0,
		},
	}),
	new Ghost({
		position: {
			x: Boundary.width * 4 + Boundary.width / 2,
			y: Boundary.height * 3 + Boundary.height / 2,
		},
		velocity: {
			x: 0,
			y: Ghost.defaultSpeed,
		},
		color: 'white',
	}),
]

//Класс кружочков опыта
class Pellet {
	constructor({ position }) {
		this.position = position
		this.radius = 3
	}
	draw() {
		c.beginPath()
		c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
		c.fillStyle = 'white'
		c.fill()
		c.closePath()
	}
}
const pellets = []

class PowerUp {
	constructor({ position }) {
		this.position = position
		this.radius = 10
	}
	draw() {
		c.beginPath()
		c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
		c.fillStyle = 'white'
		c.fill()
		c.closePath()
	}
}
const powerUps = []

mapGenerate()

let animationId
animate()
//Безпрерывное слежение за игрой

function animate() {
	animationId = requestAnimationFrame(animate)
	c.clearRect(0, 0, canvas.width, canvas.height)

	keysPressCheck()
	boundariesUpdate()
	pelletsUpdate()
	powerUpsUpdate()

	player.update()

	ghostsUpdate()
}

/**
 * Генерация карты
 */
function mapGenerate() {
	map.forEach((row, rowIndex) => {
		row.forEach((symbol, symbolIndex) => {
			switch (symbol) {
				case '-':
					boundaries.push(
						new Boundary({
							position: {
								x: Boundary.width * symbolIndex,
								y: Boundary.height * rowIndex,
							},
							image: createImg('./img/pipeHorizontal.png'),
						})
					)
					break
				case '|':
					boundaries.push(
						new Boundary({
							position: {
								x: Boundary.width * symbolIndex,
								y: Boundary.height * rowIndex,
							},
							image: createImg('./img/pipeVertical.png'),
						})
					)
					break
				case '1':
					boundaries.push(
						new Boundary({
							position: {
								x: Boundary.width * symbolIndex,
								y: Boundary.height * rowIndex,
							},
							image: createImg('./img/pipeCorner1.png'),
						})
					)
					break
				case '2':
					boundaries.push(
						new Boundary({
							position: {
								x: Boundary.width * symbolIndex,
								y: Boundary.height * rowIndex,
							},
							image: createImg('./img/pipeCorner2.png'),
						})
					)
					break
				case '3':
					boundaries.push(
						new Boundary({
							position: {
								x: Boundary.width * symbolIndex,
								y: Boundary.height * rowIndex,
							},
							image: createImg('./img/pipeCorner3.png'),
						})
					)
					break
				case '4':
					boundaries.push(
						new Boundary({
							position: {
								x: Boundary.width * symbolIndex,
								y: Boundary.height * rowIndex,
							},
							image: createImg('./img/pipeCorner4.png'),
						})
					)
					break
				case '_':
					boundaries.push(
						new Boundary({
							position: {
								x: Boundary.width * symbolIndex,
								y: Boundary.height * rowIndex,
							},
							image: createImg('./img/capBottom.png'),
						})
					)
					break
				case '5':
					boundaries.push(
						new Boundary({
							position: {
								x: Boundary.width * symbolIndex,
								y: Boundary.height * rowIndex,
							},
							image: createImg('./img/pipeConnectorBottom.png'),
						})
					)
					break
				case '^':
					boundaries.push(
						new Boundary({
							position: {
								x: Boundary.width * symbolIndex,
								y: Boundary.height * rowIndex,
							},
							image: createImg('./img/capTop.png'),
						})
					)
					break
				case '6':
					boundaries.push(
						new Boundary({
							position: {
								x: Boundary.width * symbolIndex,
								y: Boundary.height * rowIndex,
							},
							image: createImg('./img/pipeConnectorTop.png'),
						})
					)
					break
				case 'x':
					boundaries.push(
						new Boundary({
							position: {
								x: Boundary.width * symbolIndex,
								y: Boundary.height * rowIndex,
							},
							image: createImg('./img/pipeCross.png'),
						})
					)
					break
				case '[':
					boundaries.push(
						new Boundary({
							position: {
								x: Boundary.width * symbolIndex,
								y: Boundary.height * rowIndex,
							},
							image: createImg('./img/capLeft.png'),
						})
					)
					break
				case ']':
					boundaries.push(
						new Boundary({
							position: {
								x: Boundary.width * symbolIndex,
								y: Boundary.height * rowIndex,
							},
							image: createImg('./img/capRight.png'),
						})
					)
					break
				case 'b':
					boundaries.push(
						new Boundary({
							position: {
								x: Boundary.width * symbolIndex,
								y: Boundary.height * rowIndex,
							},
							image: createImg('./img/block.png'),
						})
					)
					break
				case '.':
					pellets.push(
						new Pellet({
							position: {
								x: symbolIndex * Boundary.width + Boundary.width / 2,
								y: rowIndex * Boundary.height + Boundary.height / 2,
							},
						})
					)
					break
				case 'p':
					powerUps.push(
						new PowerUp({
							position: {
								x: symbolIndex * Boundary.width + Boundary.width / 2,
								y: rowIndex * Boundary.height + Boundary.height / 2,
							},
						})
					)
					break
			}
		})
	})
}

/**
 * Проверка врезания игрока в елементы карты
 */
function boundariesUpdate() {
	boundaries.forEach(boundary => {
		boundary.draw()
		if (circleCollidesWithRectangle({ circle: player, rectangel: boundary })) {
			player.velocity.y = 0
			player.velocity.x = 0
		}
	})
}

/**
 * Обновление кружочков опыта
 */
function pelletsUpdate() {
	pellets.forEach((pellet, index) => {
		pellet.draw()

		if (hypot({ circle: pellet, circle2: player })) {
			pellets.splice(index, 1)
			player.updateScore(10)
		}
	})

	if (pellets.length === 0) {
		alert('you win')
		cancelAnimationFrame(animationId)
	}
}

/**
 * Обновление бустеров
 */
function powerUpsUpdate() {
	powerUps.forEach((powerUp, index) => {
		powerUp.draw()

		if (hypot({ circle: powerUp, circle2: player })) {
			powerUps.splice(index, 1)

			// Установка прозрачности для призраков
			ghosts.forEach(ghost => {
				ghost.scared = true

				setTimeout(() => {
					ghost.scared = false
				}, Ghost.timeToScaredDefault)
			})
		}
	})
}
/**
 * Обработка нажатых клавиш
 */
function keysPressCheck() {
	if (keys.w.pressed && lastKey === 'w') {
		for (let i = 0; i < boundaries.length; i++) {
			const boundary = boundaries[i]
			if (
				circleCollidesWithRectangle({
					circle: {
						...player,
						velocity: {
							x: 0,
							y: -player.speed,
						},
					},
					rectangel: boundary,
				})
			) {
				player.velocity.y = 0
				break
			} else {
				player.velocity.y = -player.speed
				player.rotation = Math.PI * 1.5
			}
		}
	} else if (keys.s.pressed && lastKey === 's') {
		for (let i = 0; i < boundaries.length; i++) {
			const boundary = boundaries[i]
			if (
				circleCollidesWithRectangle({
					circle: {
						...player,
						velocity: {
							x: 0,
							y: player.speed,
						},
					},
					rectangel: boundary,
				})
			) {
				player.velocity.y = 0
				break
			} else {
				player.velocity.y = player.speed
				player.rotation = Math.PI / 2
			}
		}
	} else if (keys.a.pressed && lastKey === 'a') {
		for (let i = 0; i < boundaries.length; i++) {
			const boundary = boundaries[i]
			if (
				circleCollidesWithRectangle({
					circle: {
						...player,
						velocity: {
							x: -player.speed,
							y: 0,
						},
					},
					rectangel: boundary,
				})
			) {
				player.velocity.x = 0
				break
			} else {
				player.velocity.x = -player.speed
				player.rotation = Math.PI
			}
		}
	} else if (keys.d.pressed && lastKey === 'd') {
		for (let i = 0; i < boundaries.length; i++) {
			const boundary = boundaries[i]
			if (
				circleCollidesWithRectangle({
					circle: {
						...player,
						velocity: {
							x: player.speed,
							y: 0,
						},
					},
					rectangel: boundary,
				})
			) {
				player.velocity.x = 0
				break
			} else {
				player.velocity.x = player.speed
				player.rotation = 0
			}
		}
	}
}

function ghostsUpdate() {
	ghosts.forEach((ghost, index) => {
		ghost.update()

		if (hypot({ circle: ghost, circle2: player })) {
			if (ghost.scared) {
				ghosts.splice(index, 1)
			} else {
				cancelAnimationFrame(animationId)
				alert('you lose')
			}
		}

		let collisions = []

		boundaries.forEach(boundary => {
			if (
				!collisions.includes('right') &&
				circleCollidesWithRectangle({
					circle: {
						...ghost,
						velocity: {
							x: ghost.speed,
							y: 0,
						},
					},
					rectangel: boundary,
				})
			) {
				collisions.push('right')
			}
			if (
				!collisions.includes('left') &&
				circleCollidesWithRectangle({
					circle: {
						...ghost,
						velocity: {
							x: -ghost.speed,
							y: 0,
						},
					},
					rectangel: boundary,
				})
			) {
				collisions.push('left')
			}
			if (
				!collisions.includes('up') &&
				circleCollidesWithRectangle({
					circle: {
						...ghost,
						velocity: {
							x: 0,
							y: -ghost.speed,
						},
					},
					rectangel: boundary,
				})
			) {
				collisions.push('up')
			}
			if (
				!collisions.includes('down') &&
				circleCollidesWithRectangle({
					circle: {
						...ghost,
						velocity: {
							x: 0,
							y: ghost.speed,
						},
					},
					rectangel: boundary,
				})
			) {
				collisions.push('down')
			}
		})

		if (collisions.length > ghost.prevCollisions.length) {
			ghost.prevCollisions = collisions
		}

		if (JSON.stringify(collisions) !== JSON.stringify(ghost.prevCollisions)) {
			// Предотвращение зацикливания движения
			if (ghost.velocity.x > 0 && !ghost.prevCollisions.includes('right')) {
				ghost.prevCollisions.push('right')
			} else if (
				ghost.velocity.x < 0 &&
				!ghost.prevCollisions.includes('left')
			) {
				ghost.prevCollisions.push('left')
			} else if (
				ghost.velocity.y > 0 &&
				!ghost.prevCollisions.includes('down')
			) {
				ghost.prevCollisions.push('down')
			} else if (ghost.velocity.y < 0 && !ghost.prevCollisions.includes('up')) {
				ghost.prevCollisions.push('up')
			}

			// все возможные пути
			const pathways = ghost.prevCollisions.filter(collision => {
				return !collisions.includes(collision)
			})

			// Выбраный путь
			const direction = pathways[Math.floor(Math.random() * pathways.length)]

			// Изминение движения
			switch (direction) {
				case 'up':
					ghost.velocity.x = 0
					ghost.velocity.y = -ghost.speed
					break
				case 'down':
					ghost.velocity.x = 0
					ghost.velocity.y = ghost.speed
					break
				case 'left':
					ghost.velocity.x = -ghost.speed
					ghost.velocity.y = 0
					break
				case 'right':
					ghost.velocity.x = ghost.speed
					ghost.velocity.y = 0
					break
			}

			ghost.prevCollisions = []
		}
	})
}

function circleCollidesWithRectangle({ circle, rectangel }) {
	const padding = Boundary.width / 2 - circle.radius - 1
	return (
		circle.position.y - circle.radius + circle.velocity.y <=
			rectangel.position.y + rectangel.height + padding &&
		circle.position.x + circle.radius + circle.velocity.x >=
			rectangel.position.x - padding &&
		circle.position.y + circle.radius + circle.velocity.y >=
			rectangel.position.y - padding &&
		circle.position.x - circle.radius + circle.velocity.x <=
			rectangel.position.x + rectangel.width + padding
	)
}

function hypot({ circle, circle2 }) {
	return (
		Math.hypot(
			circle.position.x - circle2.position.x,
			circle.position.y - circle2.position.y
		) <
		circle.radius + circle2.radius
	)
}

function createImg(src) {
	const image = new Image()
	image.src = src
	return image
}

addEventListener('keydown', ({ key }) => {
	switch (key) {
		case 'w':
		case 'ArrowUp':
			keys.w.pressed = true
			lastKey = 'w'
			break
		case 's':
		case 'ArrowDown':
			keys.s.pressed = true
			lastKey = 's'
			break
		case 'a':
		case 'ArrowLeft':
			keys.a.pressed = true
			lastKey = 'a'
			break
		case 'd':
		case 'ArrowRight':
			keys.d.pressed = true
			lastKey = 'd'
			break
	}
})
addEventListener('keyup', ({ key }) => {
	switch (key) {
		case 'w':
		case 'ArrowUp':
			keys.w.pressed = false
			break
		case 's':
		case 'ArrowDown':
			keys.s.pressed = false
			break
		case 'a':
		case 'ArrowLeft':
			keys.a.pressed = false
			break
		case 'd':
		case 'ArrowRight':
			keys.d.pressed = false
			break
	}
})
