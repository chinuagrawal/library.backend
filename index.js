const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Booking = require('./models/Booking');

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://chinmayagrawal:Chinu%402003@cluster0.wy88sf7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

app.get('/api/bookings', async (req, res) => {
  const { date, shift } = req.query;
  const bookings = await Booking.find({ date, shift });
  const bookedSeats = bookings.map(b => b.seatId);
  res.json(bookedSeats);
});

app.post('/api/book', async (req, res) => {
  const { date, shift, seats } = req.body;

  // Block if full day is already booked and user trying half day
  if (shift === 'am' || shift === 'pm') {
    const fullBooked = await Booking.find({
      date,
      shift: 'full',
      seatId: { $in: seats }
    });
    if (fullBooked.length > 0) {
      return res.status(400).json({
        message: 'Some seats are already booked for full day',
        alreadyBooked: fullBooked.map(b => b.seatId)
      });
    }
  }

  // Block full day if any half is already booked
  if (shift === 'full') {
    const halfBooked = await Booking.find({
      date,
      shift: { $in: ['am', 'pm'] },
      seatId: { $in: seats }
    });
    if (halfBooked.length > 0) {
      return res.status(400).json({
        message: 'Some seats are already booked for half day',
        alreadyBooked: halfBooked.map(b => b.seatId)
      });
    }
  }

  // Check if selected seats are already booked
  const existing = await Booking.find({ date, shift, seatId: { $in: seats } });
  const alreadyBooked = existing.map(b => b.seatId);

  if (alreadyBooked.length > 0) {
    return res.status(400).json({ message: 'Some seats are already booked', alreadyBooked });
  }

  const newBookings = seats.map(seatId => ({ seatId, date, shift }));
  await Booking.insertMany(newBookings);
  res.json({ success: true, booked: seats });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
