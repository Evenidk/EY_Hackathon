import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const heroSlides = [
  {
    title: "Get Tailored Government Scheme Recommendations",
    description:
      "Our AI-driven platform analyzes your profile to provide personalized recommendations for government schemes that you are eligible for.",
    img: "aischeme.png",
  },
  {
    title: "Instant Document Verification with AI",
    description:
      "Upload your documents and let our AI-powered system verify them instantly, ensuring you have all the necessary paperwork for your applications.",
    img: "datamanagement.png",
  },
  {
    title: "24/7 Assistance with Nithya",
    description:
      "Get round-the-clock support from Nithya, our AI assistant, to help you navigate through government schemes and application processes effortlessly.",
    img: "nithya-avatar.png",
  },
];

const HeroComponent: React.FC = () => {
  return (
    <div className="bg-white w-full relative">
      <section className="pt-8 pb-12 relative">
        <div className="w-full max-w-none px-6 md:px-10 relative">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={50}
            slidesPerView={1}
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000 }}
            className="w-full"
          >
            {heroSlides.map((slide, index) => (
              <SwiperSlide key={index}>
                <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-8 text-center lg:text-left w-full">
                  {/* Text Section */}
                  <div className="px-4 md:px-6 lg:px-10">
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                      {slide.title}
                    </h1>
                    <p className="mt-4 text-lg text-gray-700 sm:mt-6 sm:text-xl">
                      {slide.description}
                    </p>
                  </div>

                  {/* Image Section */}
                  <div className="flex justify-center lg:justify-end">
                    <img
                      className="w-4/5 md:w-full max-w-sm sm:max-w-md lg:max-w-lg drop-shadow-lg rounded-lg"
                      src={slide.img}
                      alt="Illustration"
                    />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <style>
            {`
              .swiper-pagination {
                bottom: -5px !important;
              }
            `}
          </style>
        </div>
      </section>
    </div>
  );
};

export default HeroComponent;
