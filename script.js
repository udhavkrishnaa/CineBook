// public/cinebook/script.js
/* CineBook – front-end demo (localStorage only) */

const TOTAL_SEATS = 56;
const SEATS_PER_ROW = 8;
const PRICE = 180;
const ROW_LETTERS = ["A", "B", "C", "D", "E", "F", "G"];

const defaultMovies = [
  { id: 1, title: "Midnight Chase", genre: "Action • Thriller", duration: "2h 18m" },
  { id: 2, title: "Galaxy Beyond", genre: "Sci-Fi • Adventure", duration: "2h 25m" },
  { id: 3, title: "The Last Melody", genre: "Drama • Music", duration: "2h 05m" },
  { id: 4, title: "Campus Days", genre: "Comedy • Romance", duration: "2h 10m" },
  { id: 5, title: "Shadow Protocol", genre: "Action • Mystery", duration: "2h 20m" },
  { id: 6, title: "Ocean Lights", genre: "Animation • Family", duration: "1h 48m" },
];
const defaultTheatres = [
  "CineBook PVR - Screen 1",
  "City Mall Cinemas - Screen 2",
  "Grand Theatre - Screen 3",
];
const defaultLocations = {
  "CineBook PVR - Screen 1": "MG Road, Bengaluru",
  "City Mall Cinemas - Screen 2": "Anna Nagar, Chennai",
  "Grand Theatre - Screen 3": "Banjara Hills, Hyderabad",
};
/* House seats that are always blocked (demo pre-sold seats) */
const houseOccupied = [3, 7, 12, 18, 25, 31, 42, 47, 50, 55];
const times = ["10:30 AM", "1:15 PM", "4:00 PM", "7:00 PM", "9:45 PM"];

const read = (k, fb) => {
  try {
    const v = JSON.parse(localStorage.getItem(k) || "null");
    return v === null ? fb : v;
  } catch {
    return fb;
  }
};

let movies = read("movies", null) || defaultMovies;
let theatres = read("theatres", null) || defaultTheatres;
let locations = read("locations", null) || defaultLocations;
/* seatMap: { "<movieId>|<theatre>|<time>": [seatNumbers...] } — permanently booked */
let seatMap = read("seatMap", {});
let user = read("user", null);

let selectedMovie = movies[0]?.id;
let selectedTime = times[0];
let tickets = 1;
let selectedSeats = [];

function save() {
  localStorage.setItem("movies", JSON.stringify(movies));
  localStorage.setItem("theatres", JSON.stringify(theatres));
  localStorage.setItem("locations", JSON.stringify(locations));
}
function saveSeatMap() {
  localStorage.setItem("seatMap", JSON.stringify(seatMap));
}

const el = (id) => document.getElementById(id);
const currentTheatre = () => el("theatreSelect").value;
const showKey = () => `${selectedMovie}|${currentTheatre()}|${selectedTime}`;
const bookedSeats = () => seatMap[showKey()] || [];
const isTaken = (n) => houseOccupied.includes(n) || bookedSeats().includes(n);
const seatLabel = (n) =>
  ROW_LETTERS[Math.floor((n - 1) / SEATS_PER_ROW)] + (((n - 1) % SEATS_PER_ROW) + 1);
const seatLabels = (arr) => arr.map(seatLabel).join(", ");

/* ---------- movies ---------- */
function renderMovies() {
  const q = el("search").value.toLowerCase();
  el("movieGrid").innerHTML = movies
    .filter((m) => m.title.toLowerCase().includes(q))
    .map(
      (m) => `<div class="movie"><div class="poster"><h3>${m.title}</h3></div>
      <div class="movie-info"><p>${m.genre} • ${m.duration}</p>
      <button onclick="selectMovie(${m.id})">Book Now</button></div></div>`
    )
    .join("");
}

function populate() {
  el("movieSelect").innerHTML = movies
    .map((m) => `<option value="${m.id}">${m.title}</option>`)
    .join("");
  el("movieSelect").value = selectedMovie;
  el("theatreSelect").innerHTML = theatres.map((t) => `<option>${t}</option>`).join("");
}

function renderTimes() {
  el("times").innerHTML = times
    .map(
      (t) =>
        `<button class="time ${t === selectedTime ? "active" : ""}" onclick="pickTime('${t}')">${t}</button>`
    )
    .join("");
}
function pickTime(t) {
  selectedTime = t;
  renderTimes();
  resetSeats();
}

/* ---------- seats ---------- */
function buildSeats() {
  const box = el("seats");
  box.innerHTML = "";
  for (let i = 1; i <= TOTAL_SEATS; i++) {
    const s = document.createElement("div");
    const taken = isTaken(i);
    s.className = "seat" + (taken ? " occupied" : "") + (selectedSeats.includes(i) ? " selected" : "");
    s.title = seatLabel(i) + (taken ? " — already booked" : "");
    if (taken) s.setAttribute("aria-disabled", "true");
    else s.onclick = () => toggleSeat(i, s);
    box.appendChild(s);
  }
}

function resetSeats() {
  selectedSeats = [];
  buildSeats();
  updateBooking();
}

function toggleSeat(n, node) {
  if (isTaken(n)) return;
  if (selectedSeats.includes(n)) {
    selectedSeats = selectedSeats.filter((x) => x !== n);
    node.classList.remove("selected");
  } else if (selectedSeats.length < tickets) {
    selectedSeats.push(n);
    node.classList.add("selected");
  } else {
    alert(`You can select only ${tickets} seat(s). Increase the ticket count to pick more.`);
  }
  updateBooking();
}

function changeTickets(d) {
  tickets = Math.max(1, Math.min(8, tickets + d));
  selectedSeats = selectedSeats.slice(0, tickets);
  el("count").textContent = tickets;
  buildSeats();
  updateBooking();
}

function selectMovie(id) {
  selectedMovie = id;
  el("movieSelect").value = id;
  resetSeats();
  el("booking").scrollIntoView({ behavior: "smooth" });
}

function updateBooking() {
  if (!movies.length) return;
  selectedMovie = Number(el("movieSelect").value);
  const m = movies.find((x) => x.id === selectedMovie);
  if (!m) return;
  const theatre = currentTheatre();
  el("summaryMovie").textContent = m.title;
  el("summaryDetails").textContent =
    `${theatre} • ${locations[theatre] || "City Centre"} • ${selectedTime} • Seats: ` +
    (selectedSeats.length ? seatLabels(selectedSeats) : "Not selected");
  el("total").textContent = "₹" + selectedSeats.length * PRICE;
}

/* called when movie/theatre dropdowns change: booked seats differ per show */
function onShowChange() {
  selectedMovie = Number(el("movieSelect").value);
  resetSeats();
}

/* ---------- booking ---------- */
function confirmBooking() {
  if (!user) return showLogin();
  if (selectedSeats.length !== tickets)
    return alert(`Please select exactly ${tickets} seat(s).`);

  const key = showKey();
  const already = seatMap[key] || [];
  /* final guard: someone may have booked these seats in another tab/session */
  const clash = selectedSeats.filter((n) => already.includes(n));
  if (clash.length) {
    alert("Sorry, seat(s) " + seatLabels(clash) + " were just booked. Please pick again.");
    resetSeats();
    return;
  }

  const m = movies.find((x) => x.id === selectedMovie);
  const theatre = currentTheatre();
  const booking = {
    id: "CB" + Date.now().toString().slice(-6),
    movie: m.title,
    theatre,
    location: locations[theatre] || "City Centre",
    time: selectedTime,
    seats: seatLabels(selectedSeats),
    seatNumbers: [...selectedSeats],
    tickets: selectedSeats.length,
    total: selectedSeats.length * PRICE,
    date: new Date().toLocaleDateString(),
    email: user.email,
    name: user.name,
    showKey: key,
  };

  /* mark seats permanently occupied for this movie + theatre + show time */
  seatMap[key] = [...already, ...selectedSeats].sort((a, b) => a - b);
  saveSeatMap();

  const history = read("history", []);
  history.unshift(booking);
  localStorage.setItem("history", JSON.stringify(history));

  showTicket(booking);

  /* reset booking controls */
  tickets = 1;
  el("count").textContent = "1";
  resetSeats();
  renderHistory();
}

/* ---------- digital ticket ---------- */
function showTicket(b) {
  el("ticketBody").innerHTML = `
    <div class="ticket">
      <div class="ticket-top">
        <div>
          <small>MOVIE</small>
          <h3>${b.movie}</h3>
          <p>${b.theatre}</p>
          <p class="muted">📍 ${b.location}</p>
        </div>
        <div class="ticket-id"><small>BOOKING ID</small><b>${b.id}</b></div>
      </div>
      <div class="ticket-tear"></div>
      <div class="ticket-grid">
        <div><small>DATE</small><b>${b.date}</b></div>
        <div><small>SHOW TIME</small><b>${b.time}</b></div>
        <div><small>TICKETS</small><b>${b.tickets}</b></div>
        <div><small>SEATS</small><b>${b.seats}</b></div>
        <div><small>BOOKED BY</small><b>${b.name || b.email}</b></div>
        <div><small>TOTAL PAID</small><b class="amount">₹${b.total}</b></div>
      </div>
      <p class="ticket-note">Please show this ticket at the counter. Seats are now reserved for this show.</p>
    </div>`;
  el("ticketModal").style.display = "flex";
}
function printTicket() {
  window.print();
}

/* ---------- history ---------- */
function renderHistory() {
  const h = read("history", []).filter((x) => user && x.email === user.email);
  el("historyList").innerHTML = h.length
    ? h
        .map(
          (b) => `<div class="booking-item">
            <div><b>${b.movie}</b><p>${b.theatre}${b.location ? " • " + b.location : ""} • ${b.time} • Seats ${b.seats}</p>
            <small class="muted">${b.date}</small></div>
            <div class="booking-right"><b>₹${b.total}</b><p>${b.id}</p>
            <button class="outline small" onclick="viewTicket('${b.id}')">View Ticket</button></div>
          </div>`
        )
        .join("")
    : `<p style="color:#999">${user ? "No bookings yet." : "Login to view bookings."}</p>`;
}
function viewTicket(id) {
  const b = read("history", []).find((x) => x.id === id);
  if (b) showTicket(b);
}

/* ---------- auth ---------- */
function showLogin() {
  el("loginModal").style.display = "flex";
}
function showSignup() {
  el("signupModal").style.display = "flex";
}
function closeModal(id) {
  el(id).style.display = "none";
}
function switchSignup() {
  closeModal("loginModal");
  showSignup();
}

function signup() {
  const n = el("name").value.trim(),
    e = el("email").value.trim().toLowerCase(),
    p = el("password").value,
    c = el("confirm").value;
  if (!n || !e || !p) return alert("Fill all fields.");
  if (!e.endsWith("@gmail.com")) return alert("Please use a Gmail address.");
  if (p.length < 6) return alert("Password must be at least 6 characters.");
  if (p !== c) return alert("Passwords do not match.");
  const u = read("users", []);
  if (u.some((x) => x.email === e)) return alert("Account already exists.");
  u.push({ name: n, email: e, password: p });
  localStorage.setItem("users", JSON.stringify(u));
  user = { name: n, email: e };
  localStorage.setItem("user", JSON.stringify(user));
  closeModal("signupModal");
  updateAuth();
  alert("Account created successfully!");
}

function login() {
  const e = el("loginEmail").value.trim().toLowerCase(),
    p = el("loginPassword").value;
  if (e === "admin@cinebook.com" && p === "admin123") {
    user = { name: "Administrator", email: e, admin: true };
  } else {
    const u = read("users", []).find((x) => x.email === e && x.password === p);
    if (!u) return alert("Invalid Gmail or password.");
    user = { name: u.name, email: u.email };
  }
  localStorage.setItem("user", JSON.stringify(user));
  closeModal("loginModal");
  updateAuth();
}

function googleLogin() {
  alert("Google Sign-In needs Firebase/Google OAuth configuration. The button is included in this front-end demo.");
}
function logout() {
  user = null;
  localStorage.removeItem("user");
  updateAuth();
}

function updateAuth() {
  const b = el("loginBtn"),
    s = el("signupBtn"),
    a = el("adminLink"),
    sec = el("admin");
  if (user) {
    b.textContent = "Logout";
    b.onclick = logout;
    s.classList.add("hidden");
    if (user.admin) {
      a.classList.remove("hidden");
      sec.style.display = "block";
    } else {
      a.classList.add("hidden");
      sec.style.display = "none";
    }
  } else {
    b.textContent = "Login";
    b.onclick = showLogin;
    s.classList.remove("hidden");
    a.classList.add("hidden");
    sec.style.display = "none";
  }
  renderHistory();
  renderAdmin();
}

/* ---------- admin ---------- */
function addMovie() {
  if (!user?.admin) return alert("Admin login required.");
  const n = el("movieName").value.trim();
  if (!n) return alert("Enter movie name.");
  movies.push({
    id: Date.now(),
    title: n,
    genre: el("movieGenre").value || "General",
    duration: el("movieDuration").value || "2h",
  });
  save();
  populate();
  renderMovies();
  renderAdmin();
  el("movieName").value = el("movieGenre").value = el("movieDuration").value = "";
}

function removeMovie(id) {
  if (!user?.admin) return;
  const m = movies.find((x) => x.id === id);
  if (confirm("Remove " + m.title + "?")) {
    movies = movies.filter((x) => x.id !== id);
    save();
    selectedMovie = movies[0]?.id;
    populate();
    renderMovies();
    renderAdmin();
    resetSeats();
  }
}

function addTheatre() {
  if (!user?.admin) return alert("Admin login required.");
  const n = el("theatreName").value.trim();
  if (!n) return alert("Enter theatre name.");
  const screen = el("theatreScreen").value.trim();
  const full = n + (screen ? " - " + screen : "");
  theatres.push(full);
  locations[full] = el("theatreLocation")?.value.trim() || "City Centre";
  save();
  populate();
  renderAdmin();
  resetSeats();
  el("theatreName").value = el("theatreScreen").value = "";
  if (el("theatreLocation")) el("theatreLocation").value = "";
}

function removeTheatre(i) {
  if (!user?.admin) return;
  if (theatres.length < 2) return alert("At least one theatre must remain.");
  if (confirm("Remove " + theatres[i] + "?")) {
    delete locations[theatres[i]];
    theatres.splice(i, 1);
    save();
    populate();
    renderAdmin();
    resetSeats();
  }
}

function renderAdmin() {
  el("adminMovies").innerHTML = movies
    .map(
      (m) => `<div class="admin-item"><span><b>${m.title}</b><br><small>${m.genre}</small></span>
      <button class="remove" onclick="removeMovie(${m.id})">Remove</button></div>`
    )
    .join("");
  el("adminTheatres").innerHTML = theatres
    .map(
      (t, i) => `<div class="admin-item"><span><b>${t}</b><br><small>${locations[t] || "City Centre"}</small></span>
      <button class="remove" onclick="removeTheatre(${i})">Remove</button></div>`
    )
    .join("");
}

/* keep other tabs in sync so booked seats stay blocked everywhere */
window.addEventListener("storage", (e) => {
  if (e.key === "seatMap") {
    seatMap = read("seatMap", {});
    buildSeats();
  }
});

/* ---------- init ---------- */
populate();
renderMovies();
renderTimes();
buildSeats();
updateBooking();
updateAuth();
