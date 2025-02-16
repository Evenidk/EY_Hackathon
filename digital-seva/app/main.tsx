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
    img: "https://d33wubrfki0l68.cloudfront.net/d6f1462500f7670e0db6b76b35054a081679a5a0/0ce15/images/hero/5.1/illustration.png",
  },
  {
    title: "Instant Document Verification with AI",
    description:
      "Upload your documents and let our AI-powered system verify them instantly, ensuring you have all the necessary paperwork for your applications.",
    img: "https://d33wubrfki0l68.cloudfront.net/d6f1462500f7670e0db6b76b35054a081679a5a0/0ce15/images/hero/5.1/illustration.png",
  },
  {
    title: "24/7 Assistance with Nithya",
    description:
      "Get round-the-clock support from Nithya, our AI assistant, to help you navigate through government schemes and application processes effortlessly.",
    img: "https://d33wubrfki0l68.cloudfront.net/d6f1462500f7670e0db6b76b35054a081679a5a0/0ce15/images/hero/5.1/illustration.png",
  },
];

const HeroComponent: React.FC = () => {
  return (
    <div className="bg-white mx-auto relative">
      <section className="pt-2 pb-2 sm:pb-12 lg:pt-0 relative">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 relative">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            navigation={{
              nextEl: ".swiper-button-next",
              prevEl: ".swiper-button-prev",
            }}
            pagination={{ clickable: true }}
            autoplay={{ delay: 3000 }}
            className="w-full relative"
          >
            {heroSlides.map((slide, index) => (
              <SwiperSlide key={index}>
                <div className="grid max-w-lg grid-cols-1 mx-auto lg:max-w-full lg:items-center lg:grid-cols-2 gap-y-12 lg:gap-x-16">
                  <div className="text-center lg:text-left">
                    <h1 className="text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl font-pj">
                      {slide.title}
                    </h1>
                    <p className="mt-2 text-lg text-gray-600 sm:mt-8 font-inter">
                      {slide.description}
                    </p>
                  </div>

                  <div>
                    <img
                      className="w-full rounded-lg shadow-lg"
                      src={slide.img}
                      alt="Illustration"
                    />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom navigation buttons */}
          <div className="swiper-button-prev absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-700 z-10"></div>
          <div className="swiper-button-next absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-700 z-10"></div>
        </div>
      </section>
    </div>
  );
};

export default HeroComponent;
