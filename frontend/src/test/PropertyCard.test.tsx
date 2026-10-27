import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import PropertyCard from '../components/property/PropertyCard';

describe('PropertyCard Component', () => {
  const sampleHouse = {
    _id: 'house123',
    title: 'Modern Bole Apartment',
    location: 'Bole, Addis Ababa',
    price: 25000,
    bedrooms: 2,
    bathrooms: 2,
    propertyType: 'apartment',
    status: 'approved',
    images: ['https://example.com/house.jpg'],
    views: 45,
    isPremium: true,
  };

  it('Renders title, location, price, bedrooms, and bathrooms correctly', () => {
    render(
      <BrowserRouter>
        <PropertyCard house={sampleHouse} index={0} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Modern Bole Apartment/i)).toBeInTheDocument();
    expect(screen.getByText(/Bole, Addis Ababa/i)).toBeInTheDocument();
    expect(screen.getByText(/25,000/i)).toBeInTheDocument();
    expect(screen.getByText(/Beds/i)).toBeInTheDocument();
    expect(screen.getByText(/Baths/i)).toBeInTheDocument();
  });

  it('Renders rented overlay/badge when property status is rented', () => {
    const rentedHouse = { ...sampleHouse, status: 'rented' };
    render(
      <BrowserRouter>
        <PropertyCard house={rentedHouse} index={0} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Rented/i)).toBeInTheDocument();
  });

  it('Displays premium badge when house is premium', () => {
    render(
      <BrowserRouter>
        <PropertyCard house={sampleHouse} index={0} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Premium/i)).toBeInTheDocument();
  });
});
