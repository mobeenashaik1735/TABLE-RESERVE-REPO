import BackButton from '../components/BackButton';

function RestaurantDetails() {
  return (
    <div className="container mx-auto p-4">
      <BackButton /> {/* Users can easily jump back to the restaurant list */}
      <h1 className="text-2xl font-bold">Sakura Sushi House</h1>
      {/* Rest of your page... */}
    </div>
  );
}