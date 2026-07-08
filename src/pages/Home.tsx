import Hero from '../components/home/Hero';
import Services from '../components/home/Services';
import Gallery from '../components/home/Gallery';
import Testimonials from '../components/home/Testimonials';
import BookingForm from '../components/home/BookingForm';
import Contact from '../components/home/Contact';

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <Gallery />
      <Testimonials />
      <BookingForm />
      <Contact />
    </>
  );
}
