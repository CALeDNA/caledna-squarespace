
$(document).ready(function () {
  // ==============
  // add dividers to dropdown menu
  // ==============

  const addDivider = (element) => {
    if (!element) { return }
    element.insertAdjacentHTML('afterend', '<li role="separator" class="divider"></li>')
  }

  const dataEls = document.querySelectorAll('[data-path="/explore-data/"]')
  addDivider(dataEls[dataEls.length -1 ])


  // ==============
  // change signin / signout text
  // ==============
  const isDevelopment = document.location.host === 'localhost:9000';

  const dataCalBaseURL = isDevelopment ? 'http://localhost:3000' : 'https://data.ucedna.com';
  const calBaseURL = isDevelopment ? 'http://localhost:9000' : 'http://www.ucedna.com';
  const authEl = document.querySelector('.js-auth');

  // console.log('document.referrer', document.referrer)
  // console.log('dataCalBaseURL', dataCalBaseURL)
  // console.log('calBaseURL', calBaseURL)
  // console.log('document.location.search', document.location.search)
  // console.log('document.location.pathname', document.location.pathname)

  const setAuthText = () => {
    if (authEl) {
      const username = JSON.parse(localStorage.getItem('username'));
      if(username) {
        let replaceStr = `<li><a href='${dataCalBaseURL}/profile'>${username}</a></li>`;
        replaceStr += `<li><a href='${dataCalBaseURL}/users/sign_out'>Sign Out</a></li>`;
        authEl.innerHTML = replaceStr;

      } else {
        let replaceStr = `<li><a href='${dataCalBaseURL}/users/sign_in'>Sign In</a></li>`;
        authEl.innerHTML = replaceStr;
      }
    }
  }

  const saveUsername = () => {
    if ((document.referrer.indexOf(dataCalBaseURL) === 0 || document.referrer.indexOf(calBaseURL) === 0 || document.referrer === '')
      && /^\?name=/.test(document.location.search)
      && document.location.pathname === "/auth-page") {

        // https://stackoverflow.com/a/5158301
      function getParameterByName(name) {
        const match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
        return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
      }

      const username = getParameterByName('name');
      localStorage.setItem('username', JSON.stringify(username));
      window.location = calBaseURL;
    }
  }

  setAuthText();
  saveUsername();

});
