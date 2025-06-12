// Wrap everything in DOMContentLoaded to ensure all elements are available

window.addEventListener('DOMContentLoaded', () => {
  fetchVoters();
  fetchCandidates();

  // Add Candidate Modal
  document.querySelector('.add-btn')?.addEventListener('click', () => {
    document.getElementById('addCandidateModal').style.display = 'flex';
  });

  document.getElementById('candidateForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
      name: form.name.value.trim(),
      class: form.className.value.trim(),
      post: form.post.value,
      image: form.image.value.trim()
    };
    try {
      const res = await fetch('https://voteapi.bgridtechnologies.in/api/add-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to add candidate');
      alert('Candidate added successfully!');
      closeModal();
      fetchCandidates();
    } catch (err) {
      console.error(err);
      alert('Error adding candidate. Please try again.');
    }
  });

  document.querySelector('.remove-btn')?.addEventListener('click', async () => {
    try {
      const res = await fetch('https://voteapi.bgridtechnologies.in/api/candidates');
      const data = await res.json();
      renderCandidateBlocks(data);
      document.getElementById('removeCandidateModal').style.display = 'flex';
    } catch (err) {
      alert('Failed to fetch candidates');
    }
  });

  document.getElementById('deleteSelectedBtn')?.addEventListener('click', () => {
    if (selectedCandidate) {
      document.getElementById('confirmModal').style.display = 'flex';
    }
  });

  document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
    try {
      const res = await fetch('https://voteapi.bgridtechnologies.in/api/delete-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedCandidate)
      });
      if (!res.ok) throw new Error('Deletion failed');
      alert('Candidate deleted successfully!');
      closeConfirmModal();
      closeRemoveModal();
    } catch (err) {
      alert('Error deleting candidate');
    }
  });

  document.querySelector('.delete-btn')?.addEventListener('click', () => {
    document.getElementById('deleteVotesModal').style.display = 'flex';
  });

  document.getElementById('confirmDeleteVotesBtn')?.addEventListener('click', async () => {
    try {
      const response = await fetch('https://voteapi.bgridtechnologies.in/api/delete-votes', {
        method: 'POST'
      });
      if (!response.ok) throw new Error("Failed to delete votes");
      alert("All votes have been deleted successfully.");
      closeDeleteVotesModal();
    } catch (error) {
      alert("Error deleting votes: " + error.message);
    }
  });

  document.querySelector('.bottom-buttons .bottom-btn:nth-child(2)')?.addEventListener('click', showRawDetails);

  document.getElementById('getResultsBtn')?.addEventListener('click', showResults);
 
});

function closeModal() {
  document.getElementById('addCandidateModal').style.display = 'none';
  document.getElementById('candidateForm').reset();
}

function closeRemoveModal() {
  document.getElementById('removeCandidateModal').style.display = 'none';
  document.getElementById('candidateList').innerHTML = '';
  document.getElementById('deleteSelectedBtn').style.display = 'none';
  selectedCandidate = null;
}

function closeConfirmModal() {
  document.getElementById('confirmModal').style.display = 'none';
}

function closeDeleteVotesModal() {
  document.getElementById('deleteVotesModal').style.display = 'none';
}

function closeRawModal() {
  document.getElementById('rawDetailsModal').style.display = 'none';
}

function closeResultsModal() {
  document.getElementById('resultsModal').style.display = 'none';
}

let selectedCandidate = null;

function fetchVoters() {
  fetch("https://voteapi.bgridtechnologies.in/api/total-voters")
    .then(res => res.json())
    .then(data => {
      const countEl = document.getElementById("voterCount");
      countEl.textContent = data.total_voters;
      const length = String(data.total_voters).length;
      const baseSize = 64;
      const reduced = Math.max(36, baseSize - (length - 2) * 8);
      countEl.style.fontSize = `${reduced}px`;
    })
    .catch(e => console.error("Failed to fetch total voters", e));
}

function fetchCandidates() {
  fetch("https://voteapi.bgridtechnologies.in/api/candidates")
    .then(res => res.json())
    .then(data => {
      const grid = document.getElementById("candidateGrid");
      grid.innerHTML = "";
      const renderCard = (candidate, post) => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <div class="post">${post}</div>
          <img src="${candidate.image}" alt="${candidate.name}">
          <div class="name">${candidate.name}</div>
          <div class="class-name">${candidate.class}</div>
        `;
        grid.appendChild(card);
      };
      data.headboy.forEach(c => renderCard(c, "Head Boy"));
      data.headgirl.forEach(c => renderCard(c, "Head Girl"));
    })
    .catch(e => console.error("Error loading candidates", e));
}

function renderCandidateBlocks(data) {
  const candidateList = document.getElementById('candidateList');
  candidateList.innerHTML = '';
  ['headboy', 'headgirl'].forEach(section => {
    const title = document.createElement('h3');
    title.textContent = section.toUpperCase();
    title.style.marginTop = '15px';
    candidateList.appendChild(title);

    data[section].forEach(candidate => {
      const block = document.createElement('div');
      block.className = 'candidate-block';
      block.innerHTML = `
        <img src="${candidate.image}" alt="${candidate.name}" />
        <div>
          <div><strong>${candidate.name}</strong></div>
          <div>Class: ${candidate.class}</div>
          <div>Post: ${section}</div>
        </div>`;
      block.addEventListener('click', () => {
        document.querySelectorAll('.candidate-block').forEach(el => el.classList.remove('selected'));
        block.classList.add('selected');
        selectedCandidate = { ...candidate, post: section };
        document.getElementById('deleteSelectedBtn').style.display = 'inline-block';
      });
      candidateList.appendChild(block);
    });
  });
}

function showRawDetails() {
  fetch('https://voteapi.bgridtechnologies.in/api/all-details')
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById('rawTableBody');
      tbody.innerHTML = '';
      data.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="padding: 6px; border: 1px solid #ccc;">${c.id}</td>
          <td style="padding: 6px; border: 1px solid #ccc;">${c.cand_id}</td>
          <td style="padding: 6px; border: 1px solid #ccc;">${c.name}</td>
          <td style="padding: 6px; border: 1px solid #ccc;">${c.class}</td>
          <td style="padding: 6px; border: 1px solid #ccc;">${c.post}</td>
          <td style="padding: 6px; border: 1px solid #ccc;">${c.vote}</td>
          <td style="padding: 6px; border: 1px solid #ccc;"><img src="${c.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" alt="Candidate Image"/></td>
        `;
        tbody.appendChild(row);
      });
      document.getElementById('rawDetailsModal').style.display = 'flex';
    })
    .catch(err => {
      alert('Failed to load details');
      console.error(err);
    });
}

function showResults() {
  fetch('https://voteapi.bgridtechnologies.in/api/result')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('winnerCardsContainer');
      container.innerHTML = '';
      data.forEach(candidate => {
        const card = document.createElement('div');
        card.style.cssText = `
          width: 220px;
          padding: 15px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          text-align: center;
          background: white;
        `;
        card.innerHTML = `
          <img src="${candidate.image}" alt="${candidate.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 50%; margin-bottom: 10px;">
          <h3 style="margin: 5px 0;">${candidate.name}</h3>
          <p style="font-weight: bold; color: #555;">${candidate.post}</p>
          <p style="color: green; font-size: 1.1em;">Votes: ${candidate.vote}</p>
        `;
        container.appendChild(card);
      });
      document.getElementById('resultsModal').style.display = 'flex';
    })
    .catch(err => {
      alert('Failed to load results.');
      console.error(err);
    });
}