"use client";
import type { CardProps } from "@heroui/react";

import React from "react";
import { Button, Card, Image, CardBody, CardFooter } from "@heroui/react";
import Logo from "./logo";
import { PopcornIcon } from "@phosphor-icons/react";

export default function MovieList() {
  const movieMockData = [
    {
      id: 1,
      title: "Inception",
      year: 2010,
      description: "A mind-bending thriller about dream invasion.",
      status: "Watched",
      releaseDate: "2010-07-16",
      poster_path:
        "https://fastly.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U",
      vote_average: 8.8,
      genre_ids: [28, 12, 878],
      tmbdId: 27205,
    },
    {
      id: 2,
      title: "The Matrix",
      year: 1999,
      description: "A hacker discovers the true nature of reality.",
      status: "Watched",
      releaseDate: "1999-03-31",
      poster_path:
        "https://fastly.picsum.photos/id/40/4106/2806.jpg?hmac=MY3ra98ut044LaWPEKwZowgydHZ_rZZUuOHrc3mL5mI",
      vote_average: 8.7,
      genre_ids: [28, 878],
      tmbdId: 603,
    },
  ];

  return (
    <>
      <ul className="mt-4 space-y-4">
        <div className="grid w-full max-w-7xl grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {movieMockData.map((movie) => (
            <Card className="w-full max-w-[520px]" key={movie.id}>
              <CardBody className="flex flex-row flex-wrap p-0 sm:flex-nowrap">
                <Image
                  removeWrapper
                  alt={movie.title}
                  className="h-auto w-full flex-none object-cover object-top md:w-48"
                  src={movie.poster_path}
                />
                <div className="flex flex-1 flex-col gap-4 p-4">
                  <div className="px-4 py-5">
                    <h3 className="text-large font-medium">{movie.title}</h3>
                    <div className="text-small text-default-400 flex flex-col gap-3 pt-2">
                      <p>{movie.description}</p>
                      <p>{movie.releaseDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PopcornIcon size={20} className="text-primary" />
                    <p className="text-small text-default-400">
                      {movie.status}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </ul>
    </>
  );
}
