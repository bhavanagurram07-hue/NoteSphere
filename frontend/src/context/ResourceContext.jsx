import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import resourceService from '../services/resourceService';
import bookmarkService from '../services/bookmarkService';
import { initialResources, initialCategories } from '../data/mockData';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { generateAcademicPdfBlob } from '../utils/generatePdf';

const ResourceContext = createContext();

export const ResourceProvider = ({ children }) => {
  const { addToast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const [resources, setResources] = useState(() => {
    const saved = localStorage.getItem('notesphere_resources');
    return saved ? JSON.parse(saved) : initialResources;
  });

  const [userUploads, setUserUploads] = useState([]);
  const [myBookmarks, setMyBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('notesphere_bookmarks');
    return saved ? JSON.parse(saved) : ['res-1', 'res-3'];
  });

  const [upvotes, setUpvotes] = useState(() => {
    const saved = localStorage.getItem('notesphere_upvotes');
    return saved ? JSON.parse(saved) : ['res-1', 'res-4'];
  });

  // Load resources from backend API
  const fetchResources = useCallback(async (params = {}) => {
    setIsLoading(true);
    try {
      const data = await resourceService.getResources(params);

      if (data?.success && data?.resources) {
        const backendResources = data.resources;

        setResources((prev) => {
          const backendIds = new Set(
            backendResources.map((resource) => resource._id || resource.id)
          );

          const localResources = prev.filter(
            (resource) => !backendIds.has(resource._id || resource.id)
          );

          return [...backendResources, ...localResources];
        });

        setTotalCount(
          data.total || data.resources.length
        );
      }
    } catch (error) {
      console.warn(
        'Backend resources fetch failed, using local repository:',
        error.message
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load current user uploads from backend API
  const fetchMyUploads = useCallback(async () => {
    if (!isAuthenticated) {
      setUserUploads([]);
      return;
    }
    try {
      const data = await resourceService.getMyUploads();
      if (data?.success && data?.resources) {
        setUserUploads(data.resources);
      }
    } catch (error) {
      // Fallback: match by author name or email
      const localMatches = resources.filter(
        (r) =>
          r.uploadedBy?.email === user?.email ||
          r.author?.name === user?.name ||
          r.author?.name === 'Alex Johnson'
      );
      setUserUploads(localMatches);
    }
  }, [isAuthenticated, user, resources]);

  // Load user bookmarks from backend API
  const fetchMyBookmarks = useCallback(async () => {
    if (!isAuthenticated) {
      setMyBookmarks([]);
      return;
    }
    try {
      const [idsData, fullData] = await Promise.all([
        bookmarkService.getMyBookmarkIds(),
        bookmarkService.getMyBookmarks(),
      ]);

      if (idsData?.success && idsData?.bookmarkIds) {
        setBookmarks(idsData.bookmarkIds);
        localStorage.setItem(
          'notesphere_bookmarks',
          JSON.stringify(idsData.bookmarkIds)
        );
      }

      if (fullData?.success && fullData?.resources) {
        setMyBookmarks(fullData.resources);
      }
    } catch (error) {
      console.warn(
        'Could not sync user bookmarks with backend:',
        error.message
      );
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyUploads();
      fetchMyBookmarks();
    } else {
      setUserUploads([]);
      setMyBookmarks([]);
    }
  }, [isAuthenticated, fetchMyUploads, fetchMyBookmarks]);

  useEffect(() => {
    localStorage.setItem(
      'notesphere_bookmarks',
      JSON.stringify(bookmarks)
    );
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem(
      'notesphere_upvotes',
      JSON.stringify(upvotes)
    );
  }, [upvotes]);

  // Toggle bookmark with live backend persistence
  const toggleBookmark = async (noteId) => {
    if (!noteId) return;

    if (!isAuthenticated) {
      addToast(
        'Please log in to save bookmarks to your cloud shelf',
        'info'
      );
      return;
    }

    const wasBookmarked = bookmarks.includes(noteId);

    // Optimistic UI update
    setBookmarks((prev) =>
      wasBookmarked
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId]
    );

    try {
      const data = await bookmarkService.toggleBookmark(noteId);

      if (data?.success) {
        addToast(
          data.bookmarked
            ? 'Saved to your cloud bookmarks!'
            : 'Removed from bookmarks',
          'success'
        );
        fetchMyBookmarks();
      }
    } catch (error) {
      // Revert optimistic update on failure
      setBookmarks((prev) =>
        wasBookmarked
          ? [...prev, noteId]
          : prev.filter((id) => id !== noteId)
      );
      addToast('Failed to update bookmark status', 'error');
    }
  };

  // Toggle upvote
  const toggleUpvote = (noteId) => {
    const isUpvoted = upvotes.includes(noteId);

    setUpvotes((prev) =>
      isUpvoted
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId]
    );

    setResources((prev) =>
      prev.map((res) => {
        const id = res._id || res.id;

        if (id === noteId) {
          const currentCount = res.upvotesCount || 0;

          return {
            ...res,
            upvotesCount: Math.max(
              0,
              isUpvoted
                ? currentCount - 1
                : currentCount + 1
            ),
          };
        }

        return res;
      })
    );

    addToast(
      isUpvoted ? 'Upvote removed' : 'Upvoted this resource!',
      'success'
    );
  };

  // Real secure download via backend API
  const recordDownload = async (noteId) => {
    try {
      const data = await resourceService.downloadResource(noteId);

      if (data?.success) {
        setResources((prev) =>
          prev.map((res) => {
            const id = res._id || res.id;

            if (id === noteId) {
              return {
                ...res,
                downloads: (res.downloads || 0) + 1,
                downloadsCount: (res.downloadsCount || 0) + 1,
              };
            }

            return res;
          })
        );

        const targetDownloadUrl =
          data.directDownloadUrl || data.downloadUrl;

        const targetFileName =
          data.fileName ||
          `NoteSphere_Resource_${noteId}.pdf`;

        addToast(
          `Downloading "${targetFileName}"...`,
          'success'
        );

        try {
          // Attempt 1: Fetch as local binary Blob to force direct saving to user's Downloads folder
          const fileResp = await fetch(targetDownloadUrl);

          if (fileResp.ok) {
            const blob = await fileResp.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const anchor = document.createElement('a');
            anchor.href = blobUrl;
            anchor.download = targetFileName;

            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);

            setTimeout(
              () => window.URL.revokeObjectURL(blobUrl),
              2000
            );

            addToast(
              `"${targetFileName}" saved to your Downloads folder!`,
              'success'
            );
          } else {
            throw new Error(
              'Blob fetch response was not ok'
            );
          }
        } catch (fetchErr) {
          // Attempt 2: Direct browser download trigger with attachment header
          const anchor = document.createElement('a');

          anchor.href = targetDownloadUrl;
          anchor.setAttribute('download', targetFileName);
          anchor.target = '_blank';

          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);

          addToast(
            `"${targetFileName}" saved to your Downloads folder!`,
            'success'
          );
        }

        return data;
      }
    } catch (error) {
      // Fallback: If backend is offline or during offline testing, generate academic PDF client-side
      const currentItem = resources.find(
        (r) => (r._id || r.id) === noteId
      );

      const cleanTitle = (
        currentItem?.title || 'Academic_Resource'
      )
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');

      const fallbackFileName = `${cleanTitle}.pdf`;

      try {
        const blob = generateAcademicPdfBlob(
          currentItem?.title || cleanTitle,
          currentItem?.subject || 'Academic Studies',
          currentItem?.department || 'College Department',
          currentItem?.author?.name ||
            currentItem?.uploadedBy?.name ||
            'NoteSphere Contributor'
        );

        const blobUrl = window.URL.createObjectURL(blob);

        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = fallbackFileName;

        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        setTimeout(
          () => window.URL.revokeObjectURL(blobUrl),
          2000
        );

        setResources((prev) =>
          prev.map((res) => {
            const id = res._id || res.id;

            if (id === noteId) {
              return {
                ...res,
                downloads: (res.downloads || 0) + 1,
                downloadsCount:
                  (res.downloadsCount || 0) + 1,
              };
            }

            return res;
          })
        );

        addToast(
          `"${fallbackFileName}" saved to your Downloads folder!`,
          'success'
        );
      } catch (clientErr) {
        addToast(
          'Unable to complete download. Please check backend server status.',
          'error'
        );
      }
    }
  };

  // Upload new resource with real progress callback
  const addResource = async (formData, onProgress) => {
    try {
      const data = await resourceService.uploadResource(
        formData,
        onProgress
      );

      if (data?.success && data?.resource) {
        setResources((prev) => [
          data.resource,
          ...prev,
        ]);

        setUserUploads((prev) => [
          data.resource,
          ...prev,
        ]);

        addToast(
          'Resource published successfully to repository!',
          'success'
        );

        return {
          success: true,
          resource: data.resource,
        };
      }
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'Upload failed. Please check file format and size.';

      addToast(msg, 'error');

      return {
        success: false,
        error: msg,
      };
    }
  };

  // Edit resource
  const updateResource = async (id, updateData) => {
    try {
      const data =
        await resourceService.updateResource(
          id,
          updateData
        );

      if (data?.success && data?.resource) {
        setResources((prev) =>
          prev.map((r) =>
            (r._id || r.id) === id
              ? data.resource
              : r
          )
        );

        setUserUploads((prev) =>
          prev.map((r) =>
            (r._id || r.id) === id
              ? data.resource
              : r
          )
        );

        addToast(
          'Resource updated successfully!',
          'success'
        );

        return {
          success: true,
          resource: data.resource,
        };
      }
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'Failed to update resource';

      addToast(msg, 'error');

      return {
        success: false,
        error: msg,
      };
    }
  };

  // Delete resource
  const deleteResource = async (id) => {
    try {
      await resourceService.deleteResource(id);

      setResources((prev) =>
        prev.filter(
          (r) => (r._id || r.id) !== id
        )
      );

      setUserUploads((prev) =>
        prev.filter(
          (r) => (r._id || r.id) !== id
        )
      );

      setBookmarks((prev) =>
        prev.filter(
          (bookmarkId) => bookmarkId !== id
        )
      );

      setMyBookmarks((prev) =>
        prev.filter(
          (r) => (r._id || r.id) !== id
        )
      );

      addToast(
        'Resource permanently deleted.',
        'info'
      );

      return { success: true };
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'Failed to delete resource';

      addToast(msg, 'error');

      return {
        success: false,
        error: msg,
      };
    }
  };

  // Fallback combined list for bookmarks page
  const bookmarkedResources =
    myBookmarks.length > 0
      ? myBookmarks
      : resources.filter((res) =>
          bookmarks.includes(res._id || res.id)
        );

  return (
    <ResourceContext.Provider
      value={{
        resources,
        categories: initialCategories,
        bookmarks,
        upvotes,
        userUploads,
        myBookmarks,
        bookmarkedResources,
        isLoading,
        totalCount,
        fetchResources,
        fetchMyUploads,
        fetchMyBookmarks,
        toggleBookmark,
        toggleUpvote,
        recordDownload,
        addResource,
        updateResource,
        deleteResource,
      }}
    >
      {children}
    </ResourceContext.Provider>
  );
};

export const useResources = () => {
  const context = useContext(ResourceContext);

  if (!context) {
    throw new Error(
      'useResources must be used within a ResourceProvider'
    );
  }

  return context;
};