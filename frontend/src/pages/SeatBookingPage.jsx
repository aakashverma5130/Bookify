import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Armchair, Clock, CheckCircle, QrCode, MapPin } from 'lucide-react';
import AppShell from '../components/AppShell';
import Card from '../components/Card';
import Modal from '../components/Modal';
import Button from '../components/Button';
import QRDisplay from '../components/QRDisplay';
import { seatApi } from '../services/apiServices';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const ZONES = ['A', 'B', 'C', 'D'];
const STATUS_COLOR = {
  null: 'bg-success-500/20 border-success-500/30 text-success-400 hover:bg-success-500/30',
  BOOKED: 'bg-danger-500/20 border-danger-500/30 text-danger-400 cursor-not-allowed',
  CHECKED_IN: 'bg-warning-500/20 border-warning-500/30 text-warning-400 cursor-not-allowed',
};

const SeatBookingPage = () => {
  const { isStudent, isLibrarian } = useAuth();

  const [seats, setSeats]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [date, setDate]             = useState(new Date().toISOString().slice(0, 10));
  const [slotStart, setSlotStart]   = useState('09:00');
  const [slotEnd, setSlotEnd]       = useState('12:00');
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [reserving, setReserving]   = useState(false);
  const [qrResult, setQrResult]     = useState(null);

  // Check-in (librarian)
  const [checkInToken, setCheckInToken] = useState('');

  const fetchSeats = async () => {
    setLoading(true);
    try {
      const res = await seatApi.getSeats({ date, slotStart, slotEnd });
      setSeats(res.data.seats || []);
    } catch { toast.error('Failed to load seats'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSeats(); }, [date, slotStart, slotEnd]);

  const handleBook = async () => {
    if (!selectedSeat) return;
    setReserving(true);
    try {
      const res = await seatApi.reserve({ seatId: selectedSeat.seat_id, date, slotStart, slotEnd });
      setQrResult({ token: res.data.qrToken, seatLabel: res.data.seatLabel });
      setSelectedSeat(null);
      toast.success(`Seat ${res.data.seatLabel} booked!`);
      fetchSeats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally {
      setReserving(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const res = await seatApi.checkIn({ token: checkInToken });
      toast.success(`Checked in: Seat ${res.data.seat}`);
      setCheckInToken('');
      fetchSeats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-in failed');
    }
  };

  const seatsByZone = ZONES.reduce((acc, zone) => {
    acc[zone] = seats.filter(s => s.zone === zone);
    return acc;
  }, {});

  return (
    <AppShell title="Seat Booking">
      {/* Controls */}
      <div className="card flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Date</label>
          <input type="date" value={date} min={new Date().toISOString().slice(0, 10)}
            onChange={e => setDate(e.target.value)} className="input py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Slot Start</label>
          <input type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} className="input py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Slot End</label>
          <input type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} className="input py-2 text-sm" />
        </div>
        <Button onClick={fetchSeats} variant="secondary" icon={MapPin}>Refresh</Button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-success-500/40" />Available</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-danger-500/40" />Booked</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-warning-500/40" />Checked In</div>
      </div>

      {/* Seat map */}
      {loading ? (
        <div className="card"><p className="text-slate-400 text-sm">Loading seats…</p></div>
      ) : (
        <div className="space-y-6">
          {ZONES.map(zone => {
            const zoneSeat = seatsByZone[zone];
            if (!zoneSeat?.length) return null;
            return (
              <Card key={zone}>
                <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Armchair size={14} className="text-primary-400" /> Zone {zone}
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {zoneSeat.map((seat) => {
                    const statusKey = seat.reservation_status || null;
                    const isAvail   = !statusKey;
                    return (
                      <motion.button
                        key={seat.seat_id}
                        onClick={() => isAvail && isStudent && setSelectedSeat(seat)}
                        disabled={!isAvail}
                        className={`aspect-square rounded-lg border text-xs font-semibold transition-all duration-150 flex flex-col items-center justify-center
                          ${STATUS_COLOR[statusKey] || STATUS_COLOR[null]}`}
                        whileHover={isAvail ? { scale: 1.1 } : {}}
                        whileTap={isAvail ? { scale: 0.95 } : {}}
                        title={seat.reserved_by || seat.seat_label}
                      >
                        {seat.seat_label}
                      </motion.button>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Check-in (librarian) */}
      {isLibrarian && (
        <Card className="mt-6">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <QrCode size={16} className="text-primary-400" /> Manual QR Check-In
          </h3>
          <div className="flex gap-3">
            <input value={checkInToken} onChange={e => setCheckInToken(e.target.value)}
              placeholder="Paste or scan QR token…" className="input flex-1" />
            <Button onClick={handleCheckIn} icon={CheckCircle}>Check In</Button>
          </div>
        </Card>
      )}

      {/* Confirm booking modal */}
      <Modal isOpen={!!selectedSeat && isStudent} onClose={() => setSelectedSeat(null)} title="Confirm Seat Booking">
        {selectedSeat && (
          <div className="space-y-4">
            <div className="card text-sm space-y-1">
              <p><span className="text-slate-400">Seat:</span> <strong className="text-white">{selectedSeat.seat_label}</strong> (Zone {selectedSeat.zone})</p>
              <p><span className="text-slate-400">Date:</span> <strong className="text-white">{date}</strong></p>
              <p><span className="text-slate-400">Slot:</span> <strong className="text-white">{slotStart} – {slotEnd}</strong></p>
            </div>
            <p className="text-xs text-slate-400">A QR pass will be generated for check-in. Valid until end of slot.</p>
            <div className="flex gap-3">
              <Button onClick={() => setSelectedSeat(null)} variant="secondary" className="flex-1 justify-center">Cancel</Button>
              <Button onClick={handleBook} loading={reserving} className="flex-1 justify-center" icon={CheckCircle}>Confirm Booking</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* QR pass modal */}
      <Modal isOpen={!!qrResult} onClose={() => setQrResult(null)} title="Your Seat Pass" size="sm">
        {qrResult && (
          <QRDisplay
            value={qrResult.token}
            label={`Seat ${qrResult.seatLabel}`}
            sublabel={`${date} · ${slotStart} – ${slotEnd}\nShow this QR at the entrance`}
          />
        )}
      </Modal>
    </AppShell>
  );
};

export default SeatBookingPage;
