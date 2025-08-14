import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { adminService } from '../services/adminService';

interface ParallelBulkCreateItem {
  parallel_name: string;
  print_run?: number | null;
  description?: string | null;
  original_print_run_text?: string | null;
  rarity_level?: "Common" | "Uncommon" | "Rare" | "Super Rare" | "Ultra Rare" | null;
  is_serial_numbered?: boolean;
}

interface BulkCreateFormData {
  parallels: ParallelBulkCreateItem[];
  jsonInput?: string;
}

interface BulkCreateResponse {
  created_count: number;
  skipped_count: number;
  error_count: number;
  results: any[];
}

export const BulkCreateParallels = ({ onClose, onComplete }: { onClose: () => void, onComplete: () => void }) => {
  const [response, setResponse] = useState<BulkCreateResponse | null>(null);
  const [mode, setMode] = useState('form'); // form or json
  const { control, handleSubmit, formState: { isSubmitting, errors } } = useForm<BulkCreateFormData>({
    defaultValues: {
      parallels: [{ parallel_name: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'parallels'
  });

  const onSubmit = async (data: BulkCreateFormData) => {
    let parallelsToSubmit: ParallelBulkCreateItem[] = [];
    if (mode === 'json' && data.jsonInput) {
      try {
        const parsedJson = JSON.parse(data.jsonInput);
        if (Array.isArray(parsedJson)) {
          parallelsToSubmit = parsedJson.map(p => {
            const printRun = p.print_run;
            let rarity: string | null = p.rarity_level || null;
            let isSerialNumbered = p.is_serial_numbered || false;

            if (printRun && printRun > 0) {
              isSerialNumbered = true;
              if (!rarity) {
                if (printRun === 1) {
                  rarity = 'Ultra Rare'
                } else if (printRun <= 50) {
                  rarity = 'Super Rare'
                } else if (printRun <= 150) {
                  rarity = 'Rare'
                } else if (printRun <= 500) {
                  rarity = 'Uncommon'
                } else {
                  rarity = 'Common'
                }
              }
            }
            return { ...p, is_serial_numbered: isSerialNumbered, rarity_level: rarity };
          });
        }
      } catch (error) {
        console.error("Invalid JSON", error);
        return;
      }
    } else {
      parallelsToSubmit = data.parallels;
    }

    const result = await adminService.bulkCreateParallels(parallelsToSubmit);
    if (result.data) {
      setResponse(result.data as BulkCreateResponse);
    } else {
      setResponse(null);
    }
  };

  if (response) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Bulk Creation Summary</h2>
          <p>Created: {response.created_count}</p>
          <p>Skipped: {response.skipped_count}</p>
          <p>Errors: {response.error_count}</p>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {response.results.map((result, index) => (
                <tr key={index}>
                  <td>{result.parallel_name}</td>
                  <td>{result.status}</td>
                  <td>{result.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => { onComplete(); onClose(); }} className="btn-primary">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '80vw' }}>
        <h2>Bulk Add Parallels</h2>
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => setMode('form')} className={`btn-secondary ${mode === 'form' ? 'active' : ''}`}>Form</button>
          <button onClick={() => setMode('json')} className={`btn-secondary ${mode === 'json' ? 'active' : ''}`}>JSON</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          {mode === 'form' ? (
            <>
              {fields.map((field, index) => (
                <div key={field.id} className="form-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <input {...control.register(`parallels.${index}.parallel_name`)} placeholder="Parallel Name" className="form-input" />
                  <input {...control.register(`parallels.${index}.print_run`)} placeholder="Print Run" type="number" className="form-input" />
                  <input {...control.register(`parallels.${index}.description`)} placeholder="Description" className="form-input" />
                  <input {...control.register(`parallels.${index}.original_print_run_text`)} placeholder="Original Print Run Text" className="form-input" />
                  <select {...control.register(`parallels.${index}.rarity_level`)} className="form-input">
                    <option value="">Select Rarity</option>
                    <option value="Common">Common</option>
                    <option value="Uncommon">Uncommon</option>
                    <option value="Rare">Rare</option>
                    <option value="Super Rare">Super Rare</option>
                    <option value="Ultra Rare">Ultra Rare</option>
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" {...control.register(`parallels.${index}.is_serial_numbered`)} />
                      <span className="form-label" style={{ margin: 0 }}>Serial Numbered</span>
                  </label>
                  <button type="button" onClick={() => remove(index)} className="btn-danger">Remove</button>
                </div>
              ))}
              <button type="button" onClick={() => append({ parallel_name: '' })} className="btn-secondary">Add Parallel</button>
            </>
          ) : (
            <div className="form-group">
              <textarea
                {...control.register('jsonInput', { required: 'JSON input is required' })}
                placeholder='Paste JSON here'
                className="form-input"
                rows={15}
              />
              {errors.jsonInput && <div className="form-error">{errors.jsonInput.message}</div>}
            </div>
          )}
          <div className="admin-form-actions">
            <button type="submit" disabled={isSubmitting} className="btn-primary">Submit</button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};