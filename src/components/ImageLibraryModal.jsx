import { useEffect, useState } from 'react';
import { listLibraryImages, addLibraryImage, deleteLibraryImage, LIBRARY_CATEGORIES } from '../lib/imageLibrary';
import '../styles/ImageLibraryModal.css';

/**
 * Modal for picking a reusable image (cover shots, generic door/closet/villa
 * photos, etc.) or adding a new one to the library. `onSelect(url)` fires
 * when the person picks an image; `onClose()` closes the modal either way.
 */
const ImageLibraryModal = ({ onSelect, onClose }) => {
  const [filter, setFilter] = useState('All');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [uploadLabel, setUploadLabel] = useState('');
  const [uploadCategory, setUploadCategory] = useState('General');
  const [uploading, setUploading] = useState(false);

  const load = async (cat) => {
    setLoading(true);
    setError('');
    try {
      setImages(await listLibraryImages(cat));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      await addLibraryImage({ file, label: uploadLabel, category: uploadCategory });
      setUploadLabel('');
      await load(filter);
    } catch (err) {
      window.alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (img, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${img.label || 'this image'}" from the library?`)) return;
    try {
      await deleteLibraryImage(img.id, img.url);
      setImages((prev) => prev.filter((i) => i.id !== img.id));
    } catch (err) {
      window.alert(err.message);
    }
  };

  return (
    <div className="lib-overlay" onClick={onClose}>
      <div className="lib-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lib-header">
          <h3>Image Library</h3>
          <button className="lib-close" onClick={onClose}>✕</button>
        </div>

        <div className="lib-tabs">
          {['All', ...LIBRARY_CATEGORIES].map((cat) => (
            <button
              key={cat}
              className={`lib-tab ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="lib-grid">
          {loading && <p className="lib-msg">Loading…</p>}
          {error && <p className="lib-msg lib-error">{error}</p>}
          {!loading && !error && images.length === 0 && (
            <p className="lib-msg">No images in this category yet — add one below.</p>
          )}
          {images.map((img) => (
            <div key={img.id} className="lib-item" onClick={() => onSelect(img.url)}>
              <img src={img.url} alt={img.label} />
              <div className="lib-item-label">{img.label || '—'}</div>
              <button className="lib-item-delete" onClick={(e) => handleDelete(img, e)} title="Delete">
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="lib-upload">
          <h4>Add a new library image</h4>
          <div className="lib-upload-row">
            <input
              type="text"
              placeholder="Label (e.g. 'Marbella villa exterior')"
              value={uploadLabel}
              onChange={(e) => setUploadLabel(e.target.value)}
            />
            <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
              {LIBRARY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <label className="lib-upload-btn">
              {uploading ? 'Uploading…' : 'Choose file'}
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => handleUpload(e.target.files?.[0])}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <p className="lib-hint">
            These images are reusable across every quote — pick a category so they're easy to find later.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageLibraryModal;
