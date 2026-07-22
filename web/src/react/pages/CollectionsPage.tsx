import '../../styles/collections.css';
import React, { useState } from 'react';
import CollectionsDirectory from './collections/CollectionsDirectory';
import CollectionDetail from './collections/CollectionDetail';
import CarnetEditor from './collections/CarnetEditor';
import * as store from './collections/store';
import { carnetToView, type CollectionView } from './collections/bits';

/**
 * `#/collections` — the carnet de collections.
 *
 * Was: a read-only wall of editor cards whose only modal offered two "go
 * elsewhere" links — a dead end that never explained what a collection was
 * *for*. Now: two shelves in one book. Editor's picks you can love, save,
 * copy and send to a trip; and your own carnets — boards you build from the
 * live place catalog, annotate, track by stamps, share and export.
 * See design-system/pages/collections.md.
 */

type Overlay =
    | { kind: 'detail'; view: CollectionView }
    | { kind: 'editor'; carnetId: string | null }
    | null;

export default function CollectionsPage() {
    const [overlay, setOverlay] = useState<Overlay>(null);

    const openCarnetById = (carnetId: string) => {
        const c = store.getCarnet(carnetId);
        if (c) setOverlay({ kind: 'detail', view: carnetToView(c) });
    };

    return (
        <>
            <CollectionsDirectory
                onOpen={(view) => setOverlay({ kind: 'detail', view })}
                onNewCarnet={() => setOverlay({ kind: 'editor', carnetId: null })}
                onEditCarnet={(carnetId) => setOverlay({ kind: 'editor', carnetId })}
            />

            {overlay?.kind === 'detail' && (
                <CollectionDetail
                    key={overlay.view.id}
                    view={overlay.view}
                    onClose={() => setOverlay(null)}
                    onEditCarnet={(carnetId) => setOverlay({ kind: 'editor', carnetId })}
                    onOpenCarnet={openCarnetById}
                />
            )}

            {overlay?.kind === 'editor' && (
                <CarnetEditor
                    key={overlay.carnetId || 'new'}
                    carnetId={overlay.carnetId}
                    onClose={() => setOverlay(null)}
                    onSaved={openCarnetById}
                />
            )}
        </>
    );
}
