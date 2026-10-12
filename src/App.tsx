import React, { useState, useEffect } from 'react';
import { initializeDatabase, db } from './storage/db';
import { Project, PhotoRecord, WorkItem } from './models';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { BottomNav } from './components/common/BottomNav';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { CameraView } from './components/camera/CameraView';
import { GalleryPage } from './pages/GalleryPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { ReportsPage } from './pages/ReportsPage';
import { BackupPage } from './pages/BackupPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPrivacyPage } from './pages/HelpPrivacyPage';
import { PhotoDetailModal } from './components/gallery/PhotoDetailModal';
import { RestampModal } from './components/gallery/RestampModal';
import { ProjectFormModal } from './components/projects/ProjectFormModal';

export function App() {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [pageParams, setPageParams] = useState<any>({});

  const [activePhotoDetail, setActivePhotoDetail] = useState<PhotoRecord | null>(null);
  const [photoToRestamp, setPhotoToRestamp] = useState<PhotoRecord | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allWorkItems, setAllWorkItems] = useState<WorkItem[]>([]);

  useEffect(() => {
    initializeDatabase().then(() => {
      loadContextData();
    });
  }, []);

  const loadContextData = async () => {
    const [pList, wList] = await Promise.all([
      db.projects.toArray(),
      db.workItems.toArray(),
    ]);
    setAllProjects(pList);
    setAllWorkItems(wList);
  };

  const navigateTo = (page: string, params: any = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadContextData();
  };

  const handleOpenPhotoDetail = (photo: PhotoRecord) => {
    setActivePhotoDetail(photo);
  };

  const handleDeletePhoto = async (photoId: string) => {
    const p = await db.photos.get(photoId);
    if (p) {
      if (p.stampedPhotoBlobId) await db.photoBlobs.delete(p.stampedPhotoBlobId);
      if (p.originalPhotoBlobId) await db.photoBlobs.delete(p.originalPhotoBlobId);
      if (p.thumbnailBlobId) await db.photoBlobs.delete(p.thumbnailBlobId);
      await db.photos.delete(photoId);
    }
    setActivePhotoDetail(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar onNavigate={navigateTo} currentPage={currentPage} />

      {/* Main Body with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar currentPage={currentPage} onNavigate={navigateTo} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-6">
          {currentPage === 'dashboard' && (
            <DashboardPage
              onNavigate={navigateTo}
              onOpenPhotoDetail={handleOpenPhotoDetail}
              onOpenNewProject={() => setIsNewProjectModalOpen(true)}
            />
          )}

          {currentPage === 'projects' && (
            <ProjectsPage onNavigate={navigateTo} />
          )}

          {currentPage === 'projectDetail' && (
            <ProjectDetailPage
              projectId={pageParams.projectId}
              onNavigate={navigateTo}
              onOpenPhotoDetail={handleOpenPhotoDetail}
            />
          )}

          {currentPage === 'camera' && (
            <div className="h-[calc(100vh-65px)]">
              <CameraView
                preSelectedProjectId={pageParams.projectId}
                onPhotoSaved={(newPhoto) => {
                  navigateTo('gallery');
                }}
              />
            </div>
          )}

          {currentPage === 'gallery' && (
            <GalleryPage
              onOpenPhotoDetail={handleOpenPhotoDetail}
              onNavigate={navigateTo}
            />
          )}

          {currentPage === 'templates' && <TemplatesPage />}

          {currentPage === 'reports' && (
            <ReportsPage
              preSelectedProjectId={pageParams.projectId}
              onNavigate={navigateTo}
            />
          )}

          {currentPage === 'backup' && <BackupPage />}

          {currentPage === 'settings' && <SettingsPage />}

          {currentPage === 'help' && <HelpPrivacyPage />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav currentPage={currentPage} onNavigate={navigateTo} />

      {/* Photo Detail Modal */}
      {activePhotoDetail && (
        <PhotoDetailModal
          isOpen={true}
          photo={activePhotoDetail}
          project={allProjects.find((p) => p.id === activePhotoDetail.projectId)}
          workItem={allWorkItems.find((w) => w.id === activePhotoDetail.workItemId)}
          onClose={() => setActivePhotoDetail(null)}
          onRestamp={(p) => {
            setActivePhotoDetail(null);
            setPhotoToRestamp(p);
          }}
          onDelete={handleDeletePhoto}
        />
      )}

      {/* Re-stamp Modal */}
      {photoToRestamp && (
        <RestampModal
          isOpen={true}
          photo={photoToRestamp}
          projects={allProjects}
          workItems={allWorkItems}
          onClose={() => setPhotoToRestamp(null)}
          onSaved={(updated) => {
            setPhotoToRestamp(null);
            setActivePhotoDetail(updated);
            loadContextData();
          }}
        />
      )}

      {/* Quick New Project Modal */}
      <ProjectFormModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSaved={(newProj) => {
          setIsNewProjectModalOpen(false);
          loadContextData();
        }}
      />
    </div>
  );
}

export default App;
