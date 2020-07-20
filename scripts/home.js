$(document).ready(function () {
  $.get("https://data.ucedna.com/api/v1/stats/home_page")
    .done((data) => {
      const numberWithCommas = (x) => {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      };

      const samplesEl = document.querySelector("#js-samples-count");
      const organismsEl = document.querySelector("#js-organisms-count");
      const usersEl = document.querySelector("#js-users-count");

      if (samplesEl) {
        samplesEl.textContent = numberWithCommas(data.samples_approved);
      }
      if (organismsEl) {
        organismsEl.textContent = numberWithCommas(data.organisms);
      }
      if (usersEl) {
        usersEl.textContent = numberWithCommas(data.users);
      }
    })
    .fail((err) => {
      console.log(err);
    });
});
