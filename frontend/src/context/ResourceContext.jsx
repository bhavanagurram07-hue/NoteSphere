import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

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

  // =====================================================
  // RESOURCES
  // =====================================================
  const [resources, setResources] = useState(() => {
    const saved = localStorage.getItem('notesphere_resources');
    return saved ? JSON.parse(saved) : initialResources;
  });

  const [userUploads, setUserUploads] = useState([]);
  const [myBookmarks, setMyBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // =====================================================
  // BOOKMARKS
  // =====================================================
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('notesphere_bookmarks');
    return saved ? JSON.parse(saved) : ['res-1', 'res-3'];
  });

  // =====================================================
  // UPVOTES
  // =====================================================
  const [upvotes, setUpvotes] = useState(() => {
    const saved = localStorage.getItem('notesphere_upvotes');
    return saved ? JSON.parse(saved) : ['res-1', 'res-4'];
  });

  // =====================================================
  // LOAD RESOURCES FROM BACKEND
  // =====================================================
  const fetchResources = useCallback(async (params = {}) => {
    setIsLoading(true);

    try {
      const data = await resourceService.getResources(params);

      console.log('[ResourceContext] Backend response:', data);

      // Backend returns:
      // {
      //   success: true,
      //   count: 11,
      //   data: [...]
      // }
      if (data?.success && Array.isArray(data?.data)) {
        const backendResources = data.data;

        setResources((prev) => {
          const backendIds = new Set(
            backendResources.map(
              (resource) => resource._id || resource.id
            )
          );

          // Keep local/mock resources that are not already
          // present in backend
          const localResources = prev.filter(
            (resource) =>
              !backendIds.has(resource._id || resource.id)
          );

          return [...backendResources, ...localResources];
        });

        setTotalCount(
          data.count || data.data.length
        );
      } else {
        console.warn(
          '[ResourceContext] Unexpected backend response:',
          data
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

  // =====================================================
  // LOAD CURRENT USER UPLOADS
  // =====================================================
  const fetchMyUploads = useCallback(async () => {
    if (!isAuthenticated) {
      setUserUploads([]);
      return;
    }

    try {
      const data = await resourceService.getMyUploads();

      // Backend also returns data: [...]
      if (data?.success && Array.isArray(data?.data)) {
        setUserUploads(data.data);
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

  // =====================================================
  // LOAD USER BOOKMARKS
  // =====================================================
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

      // Support both possible backend response names
      const bookmarkResources =
        fullData?.data || fullData?.resources;

      if (
        fullData?.success &&
        Array.isArray(bookmarkResources)
      ) {
        setMyBookmarks(bookmarkResources);
      }
    } catch (error) {
      console.warn(
        'Could not sync user bookmarks with backend:',
        error.message
      );
    }
  }, [isAuthenticated]);

  // =====================================================
  // INITIAL RESOURCE LOAD
  // =====================================================
  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // =====================================================
  // LOAD USER DATA
  // =====================================================
  useEffect(() => {
    if (isAuthenticated) {
      fetchMyUploads();
      fetchMyBookmarks();
    } else {
      setUserUploads([]);
      setMyBookmarks([]);
    }
  }, [
    isAuthenticated,
    fetchMyUploads,
    fetchMyBookmarks,
  ]);

  // =====================================================
  // SAVE BOOKMARKS
  // =====================================================
  useEffect(() => {
    localStorage.setItem(
      'notesphere_bookmarks',
      JSON.stringify(bookmarks)
    );
  }, [bookmarks]);

  // =====================================================
  // SAVE UPVOTES
  // =====================================================
  useEffect(() => {
    localStorage.setItem(
      'notesphere_upvotes',
      JSON.stringify(upvotes)
    );
  }, [upvotes]);

  // =====================================================
  // TOGGLE BOOKMARK
  // =====================================================
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
      const data =
        await bookmarkService.toggleBookmark(noteId);

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
      // Revert optimistic update
      setBookmarks((prev) =>
        wasBookmarked
          ? [...prev, noteId]
          : prev.filter((id) => id !== noteId)
      );

      addToast(
        'Failed to update bookmark status',
        'error'
      );
    }
  };

  // =====================================================
  // TOGGLE UPVOTE
  // =====================================================
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
          const currentCount =
            res.upvotesCount || 0;

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
      isUpvoted
        ? 'Upvote removed'
        : 'Upvoted this resource!',
      'success'
    );
  };

  // =====================================================
  // DOWNLOAD RESOURCE
  // =====================================================
  const recordDownload = async (noteId) => {
    try {
      const data =
        await resourceService.downloadResource(noteId);

      if (data?.success) {
        setResources((prev) =>
          prev.map((res) => {
            const id = res._id || res.id;

            if (id === noteId) {
              return {
                ...res,
                downloads:
                  (res.downloads || 0) + 1,
                downloadsCount:
                  (res.downloadsCount || 0) + 1,
              };
            }

            return res;
          })
        );

        const targetDownloadUrl =
          data.directDownloadUrl ||
          data.downloadUrl;

        const targetFileName =
          data.fileName ||
          `NoteSphere_Resource_${noteId}.pdf`;

        addToast(
          `Downloading "${targetFileName}"...`,
          'success'
        );

        try {
          // Attempt 1:
          // Fetch as Blob
          const fileResp =
            await fetch(targetDownloadUrl);

          if (fileResp.ok) {
            const blob = await fileResp.blob();

            const blobUrl =
              window.URL.createObjectURL(blob);

            const anchor =
              document.createElement('a');

            anchor.href = blobUrl;
            anchor.download = targetFileName;

            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);

            setTimeout(
              () =>
                window.URL.revokeObjectURL(
                  blobUrl
                ),
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
          // Attempt 2:
          // Direct browser download
          const anchor =
            document.createElement('a');

          anchor.href = targetDownloadUrl;
          anchor.setAttribute(
            'download',
            targetFileName
          );
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
      // Fallback for offline/local testing
      const currentItem = resources.find(
        (r) =>
          (r._id || r.id) === noteId
      );

      const cleanTitle = (
        currentItem?.title ||
        'Academic_Resource'
      )
        .replace(
          /[^a-zA-Z0-9_\-\s]/g,
          ''
        )
        .trim()
        .replace(/\s+/g, '_');

      const fallbackFileName =
        `${cleanTitle}.pdf`;

      try {
        const blob =
          generateAcademicPdfBlob(
            currentItem?.title ||
              cleanTitle,
            currentItem?.subject ||
              'Academic Studies',
            currentItem?.department ||
              'College Department',
            currentItem?.author?.name ||
              currentItem?.uploadedBy?.name ||
              'NoteSphere Contributor'
          );

        const blobUrl =
          window.URL.createObjectURL(blob);

        const anchor =
          document.createElement('a');

        anchor.href = blobUrl;
        anchor.download = fallbackFileName;

        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        setTimeout(
          () =>
            window.URL.revokeObjectURL(
              blobUrl
            ),
          2000
        );

        setResources((prev) =>
          prev.map((res) => {
            const id =
              res._id || res.id;

            if (id === noteId) {
              return {
                ...res,
                downloads:
                  (res.downloads || 0) + 1,
                downloadsCount:
                  (res.downloadsCount || 0) +
                  1,
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

  // =====================================================
  // ADD RESOURCE
  // =====================================================
  const addResource = async (
    formData,
    onProgress
  ) => {
    try {
      const data =
        await resourceService.uploadResource(
          formData,
          onProgress
        );

      // Support backend response:
      // {
      //   success: true,
      //   data: resource
      // }
      //
      // and older frontend response:
      // {
      //   success: true,
      //   resource: resource
      // }
      const createdResource =
        data?.resource || data?.data;

      if (
        data?.success &&
        createdResource
      ) {
        setResources((prev) => [
          createdResource,
          ...prev,
        ]);

        setUserUploads((prev) => [
          createdResource,
          ...prev,
        ]);

        setTotalCount(
          (prev) => prev + 1
        );

        addToast(
          'Resource published successfully to repository!',
          'success'
        );

        return {
          success: true,
          resource: createdResource,
        };
      }

      const errorMessage =
        data?.message ||
        'Failed to create resource';

      addToast(
        errorMessage,
        'error'
      );

      return {
        success: false,
        error: errorMessage,
      };

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

  // =====================================================
  // UPDATE RESOURCE
  // =====================================================
  const updateResource = async (
    id,
    updateData
  ) => {
    try {
      const data =
        await resourceService.updateResource(
          id,
          updateData
        );

      const updatedResource =
        data?.resource || data?.data;

      if (
        data?.success &&
        updatedResource
      ) {
        setResources((prev) =>
          prev.map((r) =>
            (r._id || r.id) === id
              ? updatedResource
              : r
          )
        );

        setUserUploads((prev) =>
          prev.map((r) =>
            (r._id || r.id) === id
              ? updatedResource
              : r
          )
        );

        addToast(
          'Resource updated successfully!',
          'success'
        );

        return {
          success: true,
          resource: updatedResource,
        };
      }

      const msg =
        data?.message ||
        'Failed to update resource';

      addToast(msg, 'error');

      return {
        success: false,
        error: msg,
      };

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

  // =====================================================
  // DELETE RESOURCE
  // =====================================================
  const deleteResource = async (id) => {
    try {
      await resourceService.deleteResource(id);

      setResources((prev) =>
        prev.filter(
          (r) =>
            (r._id || r.id) !== id
        )
      );

      setUserUploads((prev) =>
        prev.filter(
          (r) =>
            (r._id || r.id) !== id
        )
      );

      setBookmarks((prev) =>
        prev.filter(
          (bookmarkId) =>
            bookmarkId !== id
        )
      );

      setMyBookmarks((prev) =>
        prev.filter(
          (r) =>
            (r._id || r.id) !== id
        )
      );

      addToast(
        'Resource permanently deleted.',
        'info'
      );

      return {
        success: true,
      };

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

  // =====================================================
  // BOOKMARKED RESOURCES
  // =====================================================
  const bookmarkedResources =
    myBookmarks.length > 0
      ? myBookmarks
      : resources.filter((res) =>
          bookmarks.includes(
            res._id || res.id
          )
        );

  // =====================================================
  // PROVIDER
  // =====================================================
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

// ======================================================
// HOOK
// ======================================================
export const useResources = () => {
  const context =
    useContext(ResourceContext);

  if (!context) {
    throw new Error(
      'useResources must be used within a ResourceProvider'
    );
  }

  return context;
};