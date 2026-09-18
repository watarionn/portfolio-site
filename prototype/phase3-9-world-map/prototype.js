const districts = [...document.querySelectorAll(".district")];
const selectedOutput = document.querySelector("#debug-selected");
const viewportOutput = document.querySelector("#debug-viewport");

function updateViewportDebug() {
  viewportOutput.textContent = `${window.innerWidth} x ${window.innerHeight}`;
}

function selectDistrict(button) {
  districts.forEach((district) => {
    district.setAttribute(
      "aria-pressed",
      district === button ? "true" : "false"
    );
  });
  selectedOutput.textContent = button.dataset.district;
}

districts.forEach((district) => {
  district.setAttribute("aria-pressed", "false");
  district.addEventListener("click", () => selectDistrict(district));
});

window.addEventListener("resize", updateViewportDebug);
updateViewportDebug();
