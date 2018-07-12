// add dividers to dropdown menu
$(document).ready(function () {

  const addDivider = (element) => {
    element.insertAdjacentHTML('afterend', '<li role="separator" class="divider"></li>')
  }

  const dataEls = document.querySelectorAll('[data-path="/explore-data/"]')
  addDivider(dataEls[dataEls.length -1 ])
});
