import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Bookmark,
  Edit,
  Trash,
  Plus,
  X,
  MoreVertical,
  Maximize2,
  Film,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase, Collection, Media } from "../lib/supabase";
import { useCollectionStore } from "../store/collectionStore";
import { useMediaStore } from "../store/mediaStore";
import { Modal } from "./Modal";
import { constructMediaUrl } from "../utils/mediaUtils";
import { MediaLightbox } from "./MediaLightbox";
import { MarkdownRenderer } from "../utils/parseMarkdown";

function CollectionView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    collections,
    generateAISummary,
    loading,
    processing,
    updateCollection,
    deleteCollection,
    removeMediaFromCollection,
    addMediaToCollection,
  } = useCollectionStore();
  const { media: allMedia, fetchMedia } = useMediaStore();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);

  // Edit states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Add media modal
  const [addMediaModalOpen, setAddMediaModalOpen] = useState(false);
  const [availableMedia, setAvailableMedia] = useState<Media[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);

  // Media item removal
  const [selectedItemsToRemove, setSelectedItemsToRemove] = useState<string[]>(
    [],
  );
  const [isRemoving, setIsRemoving] = useState(false);

  // Menu dropdown
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // AI error state
  const [aiError, setAiError] = useState<string | null>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  useEffect(() => {
    const fetchCollection = async () => {
      if (!id) return;

      // Try to find in store first
      const foundCollection = collections.find((c) => c.id === id);
      if (foundCollection) {
        setCollection(foundCollection);
        setEditTitle(foundCollection.title);
        setEditDescription(foundCollection.description || "");
      } else {
        // Fetch from database if not in store
        const { data, error } = await supabase
          .from("collections")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching collection:", error);
          navigate("/gallery");
          return;
        }

        setCollection(data as Collection);
        setEditTitle(data.title);
        setEditDescription(data.description || "");
      }

      // Fetch media items in this collection
      setLoadingMedia(true);
      const { data: mediaCollections, error: mcError } = await supabase
        .from("media_collections")
        .select("media_id")
        .eq("collection_id", id);

      if (mcError) {
        console.error("Error fetching media collections:", mcError);
        setLoadingMedia(false);
        return;
      }

      if (mediaCollections.length > 0) {
        const mediaIds = mediaCollections.map((mc) => mc.media_id);

        const { data: media, error: mediaError } = await supabase
          .from("media")
          .select("*")
          .in("id", mediaIds);

        if (mediaError) {
          console.error("Error fetching media:", mediaError);
        } else {
          setMediaItems(media as Media[]);
        }
      }

      setLoadingMedia(false);
    };

    fetchCollection();
  }, [id, collections, navigate]);

  useEffect(() => {
    // Fetch all media to have available for add operation
    fetchMedia();
  }, [fetchMedia]);

  // Filter available media that's not already in the collection
  useEffect(() => {
    if (addMediaModalOpen && allMedia.length > 0) {
      const currentMediaIds = mediaItems.map((item) => item.id);
      const filtered = allMedia.filter(
        (item) => !currentMediaIds.includes(item.id),
      );
      setAvailableMedia(filtered);
    }
  }, [addMediaModalOpen, allMedia, mediaItems]);

  const handleGenerateAI = () => {
    if (!collection || mediaItems.length === 0) return;
    
    // Reset error state before generating
    setAiError(null);
    
    // Attempt to generate the summary
    generateAISummary(collection.id, mediaItems)
      .catch((error) => {
        console.error("Error caught in component:", error);
        setAiError(error.message || "Failed to generate summary. Please try again.");
      });
  };

  const handleUpdateCollection = async () => {
    if (!collection) return;

    await updateCollection(collection.id, {
      title: editTitle,
      description: editDescription,
    });

    // Update local state
    setCollection((prev) =>
      prev ? { ...prev, title: editTitle, description: editDescription } : null,
    );
    setEditModalOpen(false);
  };

  const handleDeleteCollection = async () => {
    if (!collection) return;

    await deleteCollection(collection.id);
    navigate("/gallery");
  };

  const handleToggleMediaSelection = (mediaId: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(mediaId)
        ? prev.filter((id) => id !== mediaId)
        : [...prev, mediaId],
    );
  };

  const handleAddMediaToCollection = async () => {
    if (!collection || selectedMediaIds.length === 0) return;

    await addMediaToCollection(collection.id, selectedMediaIds);

    // Refresh the collection
    const newMediaItems = [
      ...mediaItems,
      ...allMedia.filter((m) => selectedMediaIds.includes(m.id)),
    ];
    setMediaItems(newMediaItems);

    // Reset state
    setSelectedMediaIds([]);
    setAddMediaModalOpen(false);
  };

  const toggleMediaRemoval = (mediaId: string) => {
    if (!isRemoving) return;

    setSelectedItemsToRemove((prev) =>
      prev.includes(mediaId)
        ? prev.filter((id) => id !== mediaId)
        : [...prev, mediaId],
    );
  };

  const handleRemoveSelectedMedia = async () => {
    if (!collection || selectedItemsToRemove.length === 0) return;

    await removeMediaFromCollection(collection.id, selectedItemsToRemove);

    // Update local state
    setMediaItems((prev) =>
      prev.filter((item) => !selectedItemsToRemove.includes(item.id)),
    );

    // Reset state
    setSelectedItemsToRemove([]);
    setIsRemoving(false);
  };

  const closeMenuDropdown = () => {
    setMenuOpen(false);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (loading && !collection) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-700">
          Collection not found
        </h3>
        <button
          onClick={() => navigate("/gallery")}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Back to Gallery
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 mb-16">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/gallery")}
            className="text-gray-500 hover:text-gray-700 mr-4"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {collection.title}
            </h2>
            {collection.description && (
              <p className="text-gray-600 mt-1">{collection.description}</p>
            )}
          </div>
        </div>

        {/* Collection actions dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <MoreVertical size={20} className="text-gray-600" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    setEditModalOpen(true);
                    closeMenuDropdown();
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit size={16} className="mr-2" />
                  Edit Collection
                </button>
                <button
                  onClick={() => {
                    setAddMediaModalOpen(true);
                    closeMenuDropdown();
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Plus size={16} className="mr-2" />
                  Add Media
                </button>
                <button
                  onClick={() => {
                    setIsRemoving(!isRemoving);
                    if (isRemoving) setSelectedItemsToRemove([]);
                    closeMenuDropdown();
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <X size={16} className="mr-2" />
                  {isRemoving ? "Cancel Removing" : "Remove Media"}
                </button>
                <button
                  onClick={() => {
                    setDeleteModalOpen(true);
                    closeMenuDropdown();
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash size={16} className="mr-2" />
                  Delete Collection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected media removal action bar */}
      {isRemoving && (
        <div className="sticky top-0 z-10 bg-white p-4 rounded-md shadow-md flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedItemsToRemove.length} item
            {selectedItemsToRemove.length !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsRemoving(false);
                setSelectedItemsToRemove([]);
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveSelectedMedia}
              disabled={selectedItemsToRemove.length === 0}
              className={`px-3 py-1.5 text-sm rounded-md ${
                selectedItemsToRemove.length === 0
                  ? "bg-red-300 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              Remove Selected
            </button>
          </div>
        </div>
      )}

      {/* Media grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {loadingMedia ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-200 rounded-lg animate-pulse"
            ></div>
          ))
        ) : mediaItems.length > 0 ? (
          mediaItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`h-80 rounded-lg overflow-hidden relative group cursor-pointer shadow-sm hover:shadow-md transition-all ${
                isRemoving ? "hover:ring-2 ring-red-500" : ""
              } ${selectedItemsToRemove.includes(item.id) ? "ring-2 ring-red-500" : ""}`}
              onClick={() => isRemoving && toggleMediaRemoval(item.id)}
            >
              <div className="aspect-square bg-gray-100 h-full relative">
                {item.file_type?.startsWith("image/") ? (
                  <img
                    src={constructMediaUrl(
                      item.thumbnail_url || item.file_path,
                    )}
                    alt={item.file_name}
                    className="object-cover w-full h-full align-middle"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://placehold.co/400x400/f3f4f6/a1a1aa?text=Image";
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-gray-800 text-white">
                    <Film className="h-12 w-12 text-gray-400 mb-2" />
                    <span className="text-sm">Video</span>
                  </div>
                )}
                
                {/* File name overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-xs text-white truncate">
                    {item.file_name}
                  </p>
                </div>
              </div>
              
              {/* Maximize button */}
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  openLightbox(index);
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-80 z-10"
                title="View full size"
              >
                <Maximize2 size={16} className="text-white" />
              </button>
              
              {isRemoving && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                  {selectedItemsToRemove.includes(item.id) && (
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                      <X size={24} className="text-white" />
                    </div>
                  )}
                </div>
              )}
              
              {/* Metadata section */}
              <div className="p-2 bg-white text-xs">
                {item.taken_at && (
                  <div className="flex items-center text-gray-400 mt-1">
                    <Clock size={12} className="mr-1 flex-shrink-0" />
                    <span className="truncate">{new Date(item.taken_at).toLocaleDateString()}</span>
                  </div>
                )}
                {item.location && item.location !== "Unknown location" && (
                  <div className="flex items-center text-gray-400 mt-1">
                    <MapPin size={12} className="mr-1 flex-shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No media in this collection</p>
            <button
              onClick={() => setAddMediaModalOpen(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 inline-flex items-center"
            >
              <Plus size={16} className="mr-1" />
              Add Media
            </button>
          </div>
        )}
      </div>

      {/* AI summary section */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">
            AI Story Summary
          </h3>
          {!collection.ai_summary && (
            <button
              onClick={handleGenerateAI}
              disabled={processing || mediaItems.length === 0}
              className={`px-4 py-2 rounded-md ${
                processing || mediaItems.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {processing ? "Generating..." : "Generate Story"}
            </button>
          )}
        </div>

        {aiError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error generating story</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{aiError}</p>
                  {aiError.includes('format') && (
                    <div className="mt-2">
                      <p className="font-medium">Supported formats:</p>
                      <ul className="list-disc pl-5 mt-1">
                        <li>Static images (JPEG, PNG)</li>
                        <li>Animated GIFs and other formats are not supported</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {processing ? (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Generating story from your images...</p>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-md">
              <p className="text-sm text-indigo-700">This may take up to a minute. Our AI is analyzing your photos and creating a personalized story.</p>
            </div>
            
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/6"></div>
            </div>
          </div>
        ) : collection.ai_summary ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="prose prose-indigo max-w-none"
          >
            <MarkdownRenderer content={collection.ai_summary} />
          </motion.div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Generate an AI-powered story from your memories
            </p>
            {mediaItems.length === 0 && (
              <p className="text-sm text-amber-600 mt-2">
                Add some photos to your collection first!
              </p>
            )}
          </div>
        )}

        {/* Journal prompts */}
        {collection.journal_prompts &&
          collection.journal_prompts.length > 0 && (
            <div className="mt-8">
              <h4 className="text-lg font-medium text-gray-700 flex items-center">
                <Bookmark className="w-5 h-5 text-indigo-500 mr-2" />
                Journal Prompts
              </h4>
              <ul className="mt-4 space-y-3">
                {collection.journal_prompts.map((prompt, index) => (
                  <li key={index} className="bg-indigo-50 p-4 rounded-md">
                    <div className="text-gray-700">
                      <MarkdownRenderer content={prompt} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>

      {/* Edit Collection Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Collection"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="collection-title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Collection Title
            </label>
            <input
              type="text"
              id="collection-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter collection title"
            />
          </div>

          <div>
            <label
              htmlFor="collection-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description (optional)
            </label>
            <textarea
              id="collection-description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter a description for this collection"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateCollection}
              disabled={!editTitle.trim() || loading}
              className={`px-4 py-2 rounded-md ${
                !editTitle.trim() || loading
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Collection Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Collection"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this collection? This action cannot
            be undone.
          </p>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCollection}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              {loading ? "Deleting..." : "Delete Collection"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Media Modal */}
      <Modal
        isOpen={addMediaModalOpen}
        onClose={() => {
          setAddMediaModalOpen(false);
          setSelectedMediaIds([]);
        }}
        title="Add Media to Collection"
      >
        <div className="space-y-4">
          {availableMedia.length === 0 ? (
            <p className="text-center py-4 text-gray-500">
              No additional media available to add to this collection.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Select media to add to this collection:
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-2">
                {availableMedia.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleMediaSelection(item.id)}
                    className={`cursor-pointer rounded-md overflow-hidden border-2 ${
                      selectedMediaIds.includes(item.id)
                        ? "border-indigo-500"
                        : "border-transparent"
                    } transition-colors`}
                  >
                    <div className="aspect-square bg-gray-100">
                      {item.file_type?.startsWith("image/") ? (
                        <img
                          src={constructMediaUrl(
                            item.thumbnail_url || item.file_path,
                          )}
                          alt={item.file_name}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://placehold.co/200x200/f3f4f6/a1a1aa?text=Image";
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-800 text-white">
                          <p className="text-xs">Video</p>
                        </div>
                      )}
                    </div>

                    {selectedMediaIds.includes(item.id) && (
                      <div className="absolute top-1 right-1 bg-indigo-500 rounded-full w-5 h-5 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-gray-600">
                  {selectedMediaIds.length} item
                  {selectedMediaIds.length !== 1 ? "s" : ""} selected
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setAddMediaModalOpen(false);
                      setSelectedMediaIds([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMediaToCollection}
                    disabled={selectedMediaIds.length === 0 || loading}
                    className={`px-4 py-2 rounded-md ${
                      selectedMediaIds.length === 0 || loading
                        ? "bg-indigo-300 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    {loading ? "Adding..." : "Add Selected"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Lightbox */}
      <MediaLightbox 
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        media={mediaItems}
        initialIndex={lightboxIndex}
      />
    </div>
  );
}

export default CollectionView;

