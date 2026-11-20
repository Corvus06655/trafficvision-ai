
import { ScanText } from 'lucide-react'

export default function LicensePlateTable({ plates = [] }) {
  return (
    <section className="rounded-xl border border-line bg-panel p-5">
      <div className="mb-5 flex items-center gap-3">
        <ScanText className="text-signal" size={24} />
        <div>
          <h2 className="text-lg font-bold text-white">
            License Plate Detection
          </h2>
          <p className="text-sm text-muted">
            Detected vehicle registration numbers
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="p-3">Vehicle ID</th>
              <th className="p-3">License Plate</th>
              <th className="p-3">Confidence</th>
            </tr>
          </thead>

          <tbody>
            {plates.length > 0 ? (
              plates.map((plate, index) => (
                <tr key={index} className="border-b border-line text-white">
                  <td className="p-3">#{plate.vehicle_id ?? index + 1}</td>
                  <td className="p-3 font-semibold">
                    {plate.number}
                  </td>
                  <td className="p-3 text-low">
                    {(plate.confidence * 100).toFixed(1)}%
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="p-5 text-center text-muted">
                  No license plates detected yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
