document.addEventListener("DOMContentLoaded", function () {
  // When a section opens
  $('#accordion').on('shown.bs.collapse', function (e) {
    console.log("Opened:", e.target.id);
  });

  // When a section closes
  $('#accordion').on('hidden.bs.collapse', function (e) {
    console.log("Closed:", e.target.id);
  });
});