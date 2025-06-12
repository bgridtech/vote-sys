document.addEventListener("DOMContentLoaded", function () {
    const headboyGrid = document.querySelector(".grid-headboy");
    const headgirlGrid = document.querySelector(".grid-headgirl");
    const submitButton = document.getElementById("submitVote");
    const autoSubmitCheckbox = document.getElementById("autoSubmitCheckbox");

    let headboySelected = null;
    let headgirlSelected = null;

    // Function to create a candidate card
    function createCandidateCard(candidate, type, id) {
      const card = document.createElement("div");
      card.className = "candidate-card";
      card.dataset.type = type;
      card.dataset.id = id;

      card.innerHTML = `
        <img src="${candidate.image}" alt="${candidate.name}" />
        <h3>${candidate.name}</h3>
        <p>Class ${candidate.class}</p>
        <button class="select-btn">
          <i class="ri-checkbox-blank-line"></i>
          <span>Select</span>
        </button>
      `;

      // Add event listeners
      card.addEventListener("click", () => handleSelection(card));
      card.querySelector(".select-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        handleSelection(card);
      });

      return card;
    }

    // Update submit button and auto-submit logic
    function updateSubmitButton() {
      if (autoSubmitCheckbox.checked) {
        submitButton.style.display = "none";
      } else {
        submitButton.style.display = "inline-block";
        submitButton.disabled = !(headboySelected && headgirlSelected);
        submitButton.classList.toggle("active", headboySelected && headgirlSelected);
      }

      if (autoSubmitCheckbox.checked && headboySelected && headgirlSelected) {
        setTimeout(() => {
          if (headboySelected && headgirlSelected) {
            triggerSubmission();
          }
        }, 1000);
      }
    }

    // Handle selection logic
    function handleSelection(card) {
      const type = card.dataset.type;
      const isSelected = card.classList.contains("selected");
      const icon = card.querySelector("i");
      const span = card.querySelector("span");

      if (isSelected) {
        card.classList.remove("selected");
        icon.className = "ri-checkbox-blank-line";
        span.textContent = "Select";
        if (type === "headboy") headboySelected = null;
        if (type === "headgirl") headgirlSelected = null;
      } else {
        document.querySelectorAll(`.candidate-card[data-type="${type}"]`).forEach((c) => {
          c.classList.remove("selected");
          const btn = c.querySelector(".select-btn");
          btn.querySelector("i").className = "ri-checkbox-blank-line";
          btn.querySelector("span").textContent = "Select";
        });

        card.classList.add("selected");
        icon.className = "ri-checkbox-line";
        span.textContent = "Selected";
        if (type === "headboy") headboySelected = card;
        if (type === "headgirl") headgirlSelected = card;
      }

      updateSubmitButton();
    }

    // Submission modal
    function triggerSubmission() {
      const headboyName = headboySelected?.querySelector("h3")?.textContent || "";
      const headgirlName = headgirlSelected?.querySelector("h3")?.textContent || "";

      // Send vote to the server
      fetch("https://voteapi.bgridtechnologies.in/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          headboy: headboyName,
          headgirl: headgirlName
        })
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to submit vote");
          return res.json();
        })
        .then((data) => {
          console.log("Vote submitted successfully:", data);
        })
        .catch((err) => {
          console.error("Error submitting vote:", err);
        });

      // Modal and reset UI
      let countdown = 5;
      const modal = document.createElement("div");
      modal.className = "modal-backdrop";
      modal.innerHTML = `
        <div class="modal-content">
          <h2>Vote Submitted!</h2>
          <p>Returning in <span id="timer">${countdown}</span> seconds</p>
        </div>
      `;
      document.body.appendChild(modal);

      const timerSpan = modal.querySelector("#timer");
      const interval = setInterval(() => {
        countdown--;
        timerSpan.textContent = countdown;
        if (countdown <= 0) {
          clearInterval(interval);
          modal.remove();
          document.querySelectorAll(".candidate-card").forEach((card) => {
            card.classList.remove("selected");
            const btn = card.querySelector(".select-btn");
            btn.querySelector("i").className = "ri-checkbox-blank-line";
            btn.querySelector("span").textContent = "Select";
          });
          headboySelected = null;
          headgirlSelected = null;
          updateSubmitButton();
        }
      }, 1000);
    }


    // Fetch voting data once and populate candidates
    fetch("https://voteapi.bgridtechnologies.in/api/candidates")
      .then((response) => response.json())
      .then((data) => {
        // Head Boy
        data.headboy.forEach((candidate, index) => {
          const card = createCandidateCard(candidate, "headboy", index + 1);
          headboyGrid.appendChild(card);
        });

        // Head Girl
        data.headgirl.forEach((candidate, index) => {
          const card = createCandidateCard(candidate, "headgirl", index + 1);
          headgirlGrid.appendChild(card);
        });
      })
      .catch((error) => {
        console.error("Error fetching candidates:", error);
      });

    submitButton.addEventListener("click", function () {
      if (headboySelected && headgirlSelected) {
        triggerSubmission();
      }
    });

    autoSubmitCheckbox.addEventListener("change", updateSubmitButton);
  });
