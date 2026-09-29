const cards = [...document.querySelectorAll('.card')];
const count = document.getElementById('count');
const empty = document.getElementById('empty');
const input = document.getElementById('q');
let category = 'all';

function render() {
  const term = input.value.trim().toLowerCase();
  let shown = 0;
  for (const card of cards) {
    const matchCat = category === 'all' || card.dataset.cat === category;
    const matchText = !term || card.textContent.toLowerCase().includes(term);
    card.hidden = !(matchCat && matchText);
    if (!card.hidden) shown++;
  }
  count.textContent = `${shown} ${shown === 1 ? 'recept' : 'recepata'}`;
  empty.hidden = shown > 0;
}

input.addEventListener('input', render);

document.querySelectorAll('.cat').forEach((el) =>
  el.addEventListener('click', () => {
    category = el.dataset.filter;
    render();
  })
);

const toggle = document.querySelector('.nav__toggle');
const menu = document.getElementById('menu');
toggle.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
menu.addEventListener('click', () => {
  menu.classList.remove('open');
  toggle.setAttribute('aria-expanded', false);
});

document.getElementById('nl').addEventListener('submit', (e) => {
  e.preventDefault();
  document.getElementById('nl-msg').textContent = 'Hvala! Vidimo se u ponedeljak. 🍳';
  e.target.reset();
});

render();
