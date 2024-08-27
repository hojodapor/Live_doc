"use client";
import { ClientSideSuspense, RoomProvider } from "@liveblocks/react/suspense";
import React, { useEffect, useRef, useState } from "react";
import { Editor } from "@/components/editor/Editor";
import Header from "@/components/Header";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import ActiveCollaborators from "./ActiveCollaborators";
import { Input } from "@/components/ui/input";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { updateDocument } from "@/lib/actions/room.action";
import Loader from "./Loader";
import ShareModal from "./ShareModal";

export default function CollaborativeRoom({
  roomId,
  roomMetadata,
  users,
  currentUserType,
}: CollaborativeRoomProps) {
  const [documentTitle, setDocumentTitle] = useState(roomMetadata.title);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  const updateTitleHandler = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      setLoading(true);

      try {
        if (documentTitle !== roomMetadata.title) {
          const updatedDocument = await updateDocument(roomId, documentTitle);

          if (updatedDocument) {
            setEditing(false);
          }
        }
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    const handClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setEditing(false);
        updateDocument(roomId, documentTitle);
      }
    };

    document.addEventListener("mousedown", handClickOutside);

    return () => {
      document.removeEventListener("mousedown", handClickOutside);
    };
  }, [roomId, documentTitle]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  return (
    <RoomProvider id={roomId}>
      <ClientSideSuspense fallback={<Loader />}>
        <div className="collaborative-room">
          <Header>
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center"></div>

              <div
                ref={containerRef}
                className="relative flex items-center justify-center"
              >
                {editing && !loading ? (
                  <Input
                    type="text"
                    value={documentTitle}
                    ref={inputRef}
                    placeholder="Enter title"
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    onKeyDown={updateTitleHandler}
                    disabled={!editing}
                    className="document-title-input"
                  />
                ) : (
                  <p className="document-title">{documentTitle}</p>
                )}

                {currentUserType === "editor" && !editing && (
                  <Image
                    src="/assets/icons/edit.svg"
                    alt="edit"
                    width={24}
                    height={24}
                    onClick={() => setEditing(true)}
                    className="ml-2 cursor-pointer"
                  />
                )}

                {currentUserType !== "editor" && !editing && (
                  <p className="view-only-tag">View only</p>
                )}

                {loading && <p className="text-sm text-gray-400">saving...</p>}
              </div>

              <div className="flex items-center gap-4">
                <ActiveCollaborators />

                <ShareModal
                  roomId={roomId}
                  collaborators={users}
                  creatorId={roomMetadata?.creatorId}
                  currentUserType={currentUserType}
                />

                <SignedOut>
                  <SignInButton />
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </div>
            </div>
          </Header>
          <Editor roomId={roomId} currentUserType={currentUserType} />
        </div>
      </ClientSideSuspense>
    </RoomProvider>
  );
}
