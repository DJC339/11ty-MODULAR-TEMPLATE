const button = document.getElementById('menu-toggle');
const navigation = document.getElementById('primary-links');
if (button && navigation) {
  const mobile = window.matchMedia('(max-width: 47.99rem)');
  const setOpen = open => { button.setAttribute('aria-expanded', String(open)); navigation.hidden = mobile.matches && !open; };
  const sync = () => { const focused = navigation.contains(document.activeElement); button.hidden = !mobile.matches; setOpen(false); if (focused && mobile.matches) button.focus(); };
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && mobile.matches && button.getAttribute('aria-expanded') === 'true') { setOpen(false); button.focus(); } });
  navigation.addEventListener('click', event => { if (event.target.closest('a') && mobile.matches) { setOpen(false); button.focus(); } });
  mobile.addEventListener('change', sync);
  sync();
}
