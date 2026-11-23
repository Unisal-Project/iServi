import { ClientTableHeader } from "@/components/layout/ClientTableHeader";
import { ChevronLeft } from "lucide-react";
import { useRef, useState } from "react";
import type { Product } from "@/services/menu.service";

import {
  
  QuantitySelector,
  TextAreaField,
  Button
} from "@/components";

import { ClientTabBar } from "@/components/layout/ClientTabBar";

import { useProductDetail } from "./hooks/useProductDetail";

import type { ProductDetailProps } from "./types/productDetail.types";

import { formatPriceMenu } from "@/utils/formatPrice";
import { resolveImageUrl } from "@/utils/resolveImageUrl";

import "./styles.scss";

function ProductGallery({ product }: { product: Product }) {
  const photoTrack = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const photos = [...new Set([product.imageUrl, ...(product.imageUrls ?? [])]
    .map(resolveImageUrl)
    .filter((url) => url !== undefined))];
  const goToPhoto = (index: number) => {
    const track = photoTrack.current;
    if (track) track.scrollTo({ left: index * track.clientWidth });
  };

  return (
    <div className="product-detail-hero">
      <div
        className="product-detail-photo-track"
        ref={photoTrack}
        onScroll={({ currentTarget }) => {
          if (currentTarget.clientWidth) {
            const index = Math.round(currentTarget.scrollLeft / currentTarget.clientWidth);
            setActiveIndex(Math.max(0, Math.min(index, photos.length - 1)));
          }
        }}
      >
        {photos.map((photo, index) => (
          <img
            className="product-detail-photo"
            key={photo}
            src={photo}
            alt={photos.length > 1 ? `${product.name} — foto ${index + 1}` : product.name}
            loading={index === 0 ? "eager" : "lazy"}
            draggable={false}
          />
        ))}
      </div>
      {photos.length > 1 && (
        <div className="product-detail-photo-options" role="group" aria-label="Fotos do produto">
          {photos.map((photo, index) => (
            <button
              key={photo}
              type="button"
              aria-label={`Ver foto ${index + 1} de ${photos.length}`}
              aria-pressed={index === activeIndex}
              onClick={() => goToPhoto(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductDetail({ product, categoryName, onBack, onAdded, onGoToCart, onNavigate }: ProductDetailProps) {
  const { quantity, setQuantity, notes, setUnitNotes, maxQuantity, handleAdd } = useProductDetail(product, onAdded);

  return (
    <div className="product-detail-page">
      <ClientTableHeader
        backAction={<button type="button" className="product-detail-back" aria-label="Voltar" onClick={onBack}><ChevronLeft aria-hidden="true" /></button>}
         />
      <ProductGallery key={product.id} product={product} />
      <main className="product-detail-content">
        {categoryName && <span className="product-detail-category"><span aria-hidden="true" />{categoryName}</span>}
        <h1>{product.name}</h1>
        <p className="product-detail-description">{product.description}</p>
        <strong className="product-detail-price">
          {product.promotion && <><s className="product-card-old-price"><span className="sr-only">de </span>{formatPriceMenu(product.price)}</s>{" "}<span className="sr-only">por </span></>}
          {formatPriceMenu(product.finalPrice ?? product.price)}
        </strong>
        {notes.map((note, index) => (
          <TextAreaField key={index} id={`product-notes-${index}`} label={quantity > 1 ? `Observações — unidade ${index + 1}` : "Observações"} placeholder="Ex.: sem cebola, molho à parte" value={note} onChange={(event) => setUnitNotes(index, event.target.value)} />
        ))}
        <div className="product-detail-quantity-row">
          <span>Quantidade</span>
          <QuantitySelector value={quantity} onChange={setQuantity} min={1} max={maxQuantity} size="large" />
        </div>
        {maxQuantity === 0 && <p className="product-detail-stock-warning" role="status">Sem estoque disponível para este item.</p>}
        <Button className="add-to-order-button" onClick={handleAdd} disabled={maxQuantity === 0}>Adicionar ao pedido</Button>
      </main>
      <ClientTabBar onMenu={onBack} onOrder={onGoToCart} onNavigate={onNavigate} />
    </div>
  );
}
