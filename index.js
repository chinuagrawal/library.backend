const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Booking = require('./models/Booking');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔌 Connect to MongoDB (for now using local, we'll later use Atlas)
mongoose.connect(process.env.MONGO_URI)
;

// ✅ API: Get booked seats for a date and shift
app.get('/api/bookings', async (req, res) => {
  const { date, shift } = req.query;
  const bookings = await Booking.find({ date, shift });
  const bookedSeats = bookings.map(b => b.seatId);
  res.json(bookedSeats);
});

// ✅ API: Book seats
app.post('/api/book', async (req, res) => {
  const { date, shift, seats } = req.body;

  // Check if any are already booked
  const existing = await Booking.find({ date, shift, seatId: { $in: seats } });
  const alreadyBooked = existing.map(b => b.seatId);

  if (alreadyBooked.length > 0) {
    return res.status(400).json({ message: 'Some seats are already booked', alreadyBooked });
  }

  // Save new bookings
  const newBookings = seats.map(seatId => ({ seatId, date, shift }));
  await Booking.insertMany(newBookings);
  res.json({ success: true, booked: seats });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
 
